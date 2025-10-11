from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from starlette import status
from pwdlib import PasswordHash
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models import CreateUserRequest, User, Token, TokenData
from database import get_user_by_email, get_user_by_username, get_db
import jwt
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from jwt.exceptions import InvalidTokenError

auth_router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
password_hash = PasswordHash.recommended()


def get_hash_password(password: str):
    return password_hash.hash(password)


def verify_password(plain_pw: str, hashed_pw):
    return password_hash.verify(plain_pw, hashed_pw)


def authenticate_user(username: str, password: str):
    user_dict = get_user_by_username(username=username)
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
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


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
    user = get_user_by_username(token_data.username)
    if not user:
        raise credentials_exception
    return user


@auth_router.post("/register", response_model=User)
async def register(user: CreateUserRequest):
    if get_user_by_username(user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user already exists with this username",
        )
    if get_user_by_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user already exists with this email",
        )
    hash_password = get_hash_password(user.password)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users(email, username, hashed_password) VALUES (%s, %s, %s) RETURNING id",
            (user.email, user.username, hash_password),
        )
        user_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()

    return User(id=user_id, username=user.username, email=user.email)


@auth_router.post("/token", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> Token:
    user = authenticate_user(form_data.username, form_data.password)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_accesstoken({"sub": user["username"]}, access_token_expires)
    return Token(access_token=access_token, token_type="bearer")


# a sample for protected endpoint
@auth_router.get("/me", response_model=User)
async def get_current_user_info(
    currentuser: Annotated[User, Depends(get_current_user)],
):
    return currentuser
