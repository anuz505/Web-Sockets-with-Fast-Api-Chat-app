from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
from models.messages import Message_Response
import datetime
from core.logger import logger


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        # self.user_friends: Dict[int, Set[int]] = {}

    async def connect(self, user_id, websocket: WebSocket):
        self.active_connections[user_id] = websocket
        # await self.broadcast_status(user_id, "online")

    async def disconnect(self, user_id):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        # await self.broadcast_status(user_id, "offline")

    async def send_private_message(self, reciever_id: int, msg: dict):
        if reciever_id in self.active_connections:
            try:
                websocket = self.active_connections[reciever_id]
                await websocket.send_json(
                    {
                        "type": "new_message",
                        **msg,
                    }
                )
                logger.debug(f"📨 Message sent to user {reciever_id}")
                return True

            except Exception as e:
                logger.error(f"{e}")
                await self.disconnect(reciever_id)
                return False

    def is_user_online(self, user_id: int) -> bool:
        """Check if user is currently connected"""
        return user_id in self.active_connections

    async def handle_redis_message(self, message_data: dict):
        """Handle incoming Redis pub/sub messages"""
        try:
            message_type = message_data.get("type")
            user_id = message_data.get("user_id")

            if not user_id:
                logger.warning("Redis message missing user_id")
                return

            # Check if user is connected to this container
            if user_id not in self.active_connections:
                logger.debug(f"User {user_id} not connected to this container")
                return

            if message_type == "new_message":
                # Extract message data (remove Redis-specific fields)
                msg_data = {
                    k: v
                    for k, v in message_data.items()
                    if k not in ["type", "user_id"]
                }

                # Send message to local WebSocket connection
                success = await self.send_private_message(user_id, msg_data)

                if success:
                    logger.info(f"🔔 Redis message delivered to user {user_id}")
                else:
                    logger.warning(
                        f"❌ Failed to deliver Redis message to user {user_id}"
                    )

            else:
                logger.warning(f"Unknown Redis message type: {message_type}")

        except Exception as e:
            logger.error(f"Error handling Redis message: {e}", exc_info=True)


manager = ConnectionManager()
