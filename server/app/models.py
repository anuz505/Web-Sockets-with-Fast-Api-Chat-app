from pydantic import BaseModel, EmailStr, Field


class CreateUserRequest(BaseModel):
    email: EmailStr = Field(
        ..., description="email of the user", example="anuj@gmail.com"
    )
    username: str = Field(..., description="name of the user", example="mobius505")
    password: str = Field(..., description="password", example="whatever")


class User(BaseModel):
    id: int
    username: str = Field(..., description="name of the user", example="mobius505")
    email: EmailStr = Field(
        ..., description="email of the user", example="anuj@gmail.com"
    )


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str
