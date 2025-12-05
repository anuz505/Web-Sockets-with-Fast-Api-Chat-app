from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from starlette import status
from pwdlib import PasswordHash
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models.users_model import CreateUserRequest, User, Token, TokenData
from db.database import get_user_by_email, get_user_by_username, db_connection
import jwt
from core.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from jwt.exceptions import InvalidTokenError

auth_router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
password_hash = PasswordHash.recommended()


def get_hash_password(password: str):
    return password_hash.hash(password)


def verify_password(plain_pw: str, hashed_pw):
    return password_hash.verify(plain_pw, hashed_pw)


async def authenticate_user(username: str, password: str):
    user_dict = await get_user_by_username(username=username)
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="user does not exist"
        )
    if not verify_password(password, user_dict["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="wrong password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_dict


def create_accesstoken(data: dict, expires_delta: timedelta | None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refreshtoken(data: dict, expires_delta: timedelta | None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_refreshtoken(refresh_token: str):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate the refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        token_type = payload.get("type")

        if username is None or token_type != "refresh":
            raise credentials_exception
        return username
    except InvalidTokenError:
        raise credentials_exception


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    user = await get_user_by_username(token_data.username)
    if not user:
        raise credentials_exception
    return user


@auth_router.post("/register", response_model=User)
async def register(user: CreateUserRequest):
    if await get_user_by_username(user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user already exists with this username",
        )
    if await get_user_by_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user already exists with this email",
        )
    hash_password = get_hash_password(user.password)
    query = """
        INSERT INTO users (email, username, hashed_password)
        VALUES (:email, :username, :hashed_password)
        RETURNING id, email, username, created_at
    """
    new_user = await db_connection.fetch_one(
        query=query,
        values={
            "email": user.email,
            "username": user.username,
            "hashed_password": hash_password,
        },
    )

    return User(
        id=new_user["id"], username=new_user["username"], email=new_user["email"]
    )


@auth_router.post("/token", response_model=Token)
async def login(
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    user = await authenticate_user(form_data.username, form_data.password)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_accesstoken({"sub": user["username"]}, access_token_expires)

    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = create_refreshtoken(
        {"sub": user["username"]}, refresh_token_expires
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )

    return Token(access_token=access_token, token_type="bearer")


@auth_router.post("/refresh", response_model=Token)
async def refresh_access_token(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="refresh token not found"
        )
    username = verify_refreshtoken(refresh_token)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_accesstoken({"sub": username}, access_token_expires)

    # Rotate refresh token
    new_refresh_token = create_refreshtoken(
        {"sub": username}, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )

    return Token(access_token=new_access_token, token_type="bearer")


@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="refresh_token",
        path="/",
        samesite="lax",
    )
    return {"message": "Successfully logged out"}


# a sample for protected endpoint
@auth_router.get("/me", response_model=User)
async def get_current_user_info(
    currentuser: Annotated[User, Depends(get_current_user)],
):
    return currentuser
