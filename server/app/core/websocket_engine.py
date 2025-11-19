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

        # if msg.reciever_id in self.active_connections:
        #     websocket = self.active_connections[msg.reciever_id]
        #     await websocket.send_json(
        #         {"type": "message", "data": msg.model_dump(mode="json")}
        #     )
        #     return True
        # return False

    def is_user_online(self, user_id: int) -> bool:
        """Check if user is currently connected"""
        return user_id in self.active_connections

    # async def send_json_message(self, data: dict, user_id: int):
    #     if user_id in self.active_connections:
    #         websocket = self.active_connections[user_id]
    #         await websocket.send_json(data)

    # async def broadcast_status(self, user_id: int, status: str):
    #     if user_id in self.user_friends:
    #         for friend_id in self.user_friends[user_id]:
    #             if friend_id in self.active_connections:
    #                 await self.send_json_message(
    #                     {
    #                         "type": "status_update",
    #                         "user_id": user_id,
    #                         "status": status,
    #                         "timestamp": datetime.now(),
    #                     },
    #                     friend_id,
    #                 )

    # def get_online_friends(self, user_id: int) -> Set[int]:
    #     """Get list of online friends for a user"""
    #     if user_id not in self.user_friends:
    #         return set()
    #     return {
    #         friend_id
    #         for friend_id in self.user_friends[user_id]
    #         if friend_id in self.active_connections
    #     }


manager = ConnectionManager()
