from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

load_dotenv()
import os

# SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


class Settings(BaseSettings):
    app_name: str = "Sarcasm Sync Chat App"
    app_version: str = "1.0.0"
    debug: bool = False
    log_level: str = "INFO"
    host: str = "0.0.0.0"
    port: int = 8000

    secret_key: str = Field(description="jwt secret")
    algorithm: str = Field(default="HS256", description="JWT algo")
    access_token_expire_minutes: int = Field(default=30, description="jwt token")
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )
    # db settings
    postgres_user: str = Field(default="postgres", description="PostgreSQL username")
    postgres_password: str = Field(default="root", description="PostgreSQL password")
    postgres_host: str = Field(default="localhost", description="PostgreSQL host")
    postgres_port: int = Field(default=5432, description="PostgreSQL port")
    postgres_db: str = Field(default="chat", description="PostgreSQL database name")

    @property
    def database_url(self) -> str:
        """Construct async PostgreSQL connection URL."""
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # redis
    redis_host: str = Field(default="redis", description="redis host")
    redis_port: int = Field(default=6379, description="redis port")
    redis_db: int = Field(default=1, description="redis db name")


settings = Settings()

SECRET_KEY = settings.secret_key
ALGORITHM = settings.algorithm
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes
