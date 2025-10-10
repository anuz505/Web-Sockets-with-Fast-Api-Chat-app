from pydantic import BaseModel
from fastapi import Path


class CreateUserRequest(BaseModel):
    username: str = Path(..., description="name of the user", example="mobius505")
    password: str = Path(..., description="password", example="whatever")


class Token(BaseModel):
    access_token: str
    token_type: str
