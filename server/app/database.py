import psycopg2
from contextlib import contextmanager
from config import DB_CONFIG
from typing import Annotated
from fastapi import Depends


@contextmanager
def get_db():
    connection = psycopg2.connect(**DB_CONFIG)
    try:
        yield connection
    finally:
        connection.close()


db_dependency = Annotated[psycopg2.extensions.connection, Depends(get_db)]
