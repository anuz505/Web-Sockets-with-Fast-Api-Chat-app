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
        await websocket.accept()
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
                        "type": "message",
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


manager = ConnectionManager()
