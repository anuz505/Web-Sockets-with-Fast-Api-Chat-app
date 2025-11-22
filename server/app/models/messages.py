from pydantic import BaseModel
from datetime import datetime


class Message_Create(BaseModel):
    reciever_id: int
    content: str


class Message_Response(BaseModel):
    id: int
    sender_id: int
    reciever_id: int
    content: str
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat()}
