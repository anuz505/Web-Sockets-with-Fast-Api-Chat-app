from typing import Optional, Dict, Callable
import redis.asyncio as redis
from core.config import settings
from core.logger import logger
from redis.exceptions import ConnectionError, RedisError, TimeoutError
import asyncio
import json


class RedisServer:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.pubsub: Optional[redis.client.PubSub] = None
        self.subscribers: Dict[str, Callable] = {}
        self.is_connected: bool = False
        self.pool: Optional[redis.ConnectionPool] = None
        self._reconnecting: bool = False

    async def connect(self, auto_reconnect: bool = True):
        try:
            self.pool = redis.ConnectionPool(
                host=settings.redis_host,
                port=settings.redis_port,
                db=settings.redis_db,
                # password = REDIS_PASSWORD
                max_connections=50,
                socket_timeout=5,
                socket_connect_timeout=5,
            )
            self.redis_client = redis.Redis(
                connection_pool=self.pool,
                decode_responses=True,
                health_check_interval=30,
                retry_on_timeout=True,
            )
            await self.redis_client.ping()
            self.is_connected = True
            self._reconnecting = False
            logger.info("Redis connected successfully")
            return True

        except ConnectionError as e:
            logger.warning(f"Redis connection error: {e}")
            self.is_connected = False
            if auto_reconnect and not self._reconnecting:
                return await self.reconnect()
            return False

        except TimeoutError as e:
            logger.warning(f"Redis timeout error: {e}")
            self.is_connected = False
            if auto_reconnect and not self._reconnecting:
                return await self.reconnect()
            return False
        except RedisError as e:
            logger.error(f"Redis error: {e}")
            self.is_connected = False
            return False

        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            self.is_connected = False
            return False

    async def disconnect(self):
        try:
            if self.pubsub:
                await self.pubsub.aclose()
                logger.debug("pubsub connection closed")
            if self.redis_client:
                await self.redis_client.aclose()
                logger.debug("redis client disconnected")
            self.is_connected = False
            self.subscribers.clear()
            logger.info("Redis disconnected successfully")

        except Exception as e:
            logger.error(f"Error disconnecting Redis: {e}")

    async def publish_message(self, channel: str, message: dict):
        if not self.is_connected or not self.redis_client:
            logger.error("Redis is not connected")
            return False

        try:
            message_json = json.dumps(message)
            await self.redis_client.publish(channel, message_json)
            logger.debug(f"Published message to channel: {channel}")
            return True
        except json.JSONEncodeError as e:
            logger.error(f"Failed to serialize message for channel '{channel}': {e}")
            return False
        except RedisError as e:
            logger.error(f"Redis error publishing to channel '{channel}': {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to publish message: {e}")
            return False

    async def subscribe_to_channel(self, channel: str, handler: Callable):
        if not self.is_connected or not self.redis_client:
            logger.error("Redis is not connected")
            return False

        try:
            if not self.pubsub:
                self.pubsub = self.redis_client.pubsub()

            await self.pubsub.subscribe(channel)
            self.subscribers[channel] = handler
            logger.info(f"Subscribed to channel: {channel}")
            return True
        except RedisError as e:
            logger.error(f"Failed to subscribe to channel due to: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to subscribe to channel {channel}: {e}")
            return False

    async def unsubscribe_from_channel(self, channel: str):
        if not self.is_connected or not self.redis_client:
            logger.error("Redis is not connected")
            return False
        if not self.pubsub:  # Added check for pubsub
            logger.warning("No PubSub connection to unsubscribe from")
            return False
        try:
            await self.pubsub.unsubscribe(channel)
            self.subscribers.pop(channel, None)
            logger.info(f"Unsubscribed from channel: {channel}")
            return True
        except RedisError as e:
            logger.error(f"Failed to unsubscribe from channel due to: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to unsubscribe from channel {channel}: {e}")
            return False

    async def start_message_listener(self):
        if not self.pubsub:
            logger.error("PubSub not initialized")
            return False
        try:
            logger.info("Starting Redis message listener")
            async for message in self.pubsub.listen():
                if message["type"] == "message":
                    channel = message["channel"]
                    data = message["data"]
                    if channel in self.subscribers:
                        try:
                            message_data = json.loads(data)
                            await self.subscribers[channel](message_data)
                        except json.JSONDecodeError as e:
                            logger.error(f"Invalid JSON in message: {e}")
                        except Exception as e:
                            logger.error(f"Error handling message: {e}")
        except RedisError as e:
            logger.error(f"Redis error: {e}")
            # Try to reconnect and restart listener
            if await self.reconnect():
                return await self.start_message_listener()
            return False
        except Exception as e:
            logger.error(f"Redis listener error: {e}")
            return False

    async def reconnect(self):
        if self._reconnecting:
            logger.info("Reconnection already in progress")
            return False

        self._reconnecting = True
        max_retries = 5
        retry_delay = 1
        try:
            for attempt in range(max_retries):
                try:
                    logger.info(
                        f"Reconnecting to Redis (attempt {attempt + 1}/{max_retries})"
                    )
                    await self.disconnect()
                    await asyncio.sleep(retry_delay)

                    # Use auto_reconnect=False to prevent infinite recursion
                    if await self.connect(auto_reconnect=False):
                        # Resubscribe to channels
                        if self.subscribers:
                            for channel, handler in list(self.subscribers.items()):
                                await self.subscribe_to_channel(channel, handler)
                        logger.info("Redis reconnected successfully")
                        return True
                except Exception as e:
                    logger.error(f"Reconnect attempt {attempt + 1} failed: {e}")

                retry_delay = min(retry_delay * 2, 30)

            logger.error("Failed to reconnect to Redis after all attempts")
            return False
        finally:
            self._reconnecting = False

    def get_user_channel(self, user_id: int):
        return f"user:{user_id}"

    def get_conversation_channel(self, user1_id: int, user2_id: int) -> str:
        min_id, max_id = min(user1_id, user2_id), max(user1_id, user2_id)
        return f"chat:{min_id}:{max_id}"


redis_service = RedisServer()
