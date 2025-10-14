from dotenv import load_dotenv

load_dotenv()
import os

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


DB_CONFIG = {
    "host": "localhost",
    "database": "auth_db",
    "user": "postgres",
    "password": "root",
    "port": 5432,
}
