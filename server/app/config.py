from dotenv import load_dotenv

load_dotenv()
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))


DB_CONFIG = {
    "host": "localhost",
    "database": "auth_db",
    "user": "postgres",
    "password": "root",
    "port": 5432,
}
