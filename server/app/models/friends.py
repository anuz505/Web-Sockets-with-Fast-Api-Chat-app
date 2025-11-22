from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal


class FriendShipResponse(BaseModel):
    id: int
    user_id: int
    friend_id: int
    status: Literal["pending", "accepted", "blocked"]
    created_at: datetime


class FriendRequest(BaseModel):
    id: int = Field(description="User ID to send request to", gt=0)


class FriendsProfile(BaseModel):
    id: int
    username: str
    friendship_status: Literal["pending", "accepted", "blocked"]
    friendship_created_at: datetime
