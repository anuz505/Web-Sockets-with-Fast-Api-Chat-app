from fastapi import APIRouter, Depends, HTTPException
from api.auth import get_current_user
from core.logger import logger
from models.messages import Message_Response
from db import db_connection

message_router = APIRouter(prefix="/messages", tags=["messages"])


@message_router.get(
    "/conversations/{other_user_id}", response_model=list[Message_Response]
)
async def get_messages(
    other_user_id: int,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user),
):
    try:
        user_id = current_user["id"]
        query = """
                    SELECT id, sender_id, reciever_id, content, created_at, is_read FROM messages
                    WHERE (sender_id= :user_id AND reciever_id= :other_user_id)
                    OR ((sender_id= :other_user_id AND reciever_id= :user_id))
                    ORDER BY created_at DESC
                    LIMIT :limit OFFSET :offset
                """
        messages = await db_connection.fetch_all(
            query=query,
            values={
                "user_id": user_id,
                "other_user_id": other_user_id,
                "limit": limit,
                "offset": offset,
            },
        )
        return [Message_Response(**message) for message in messages]
    except Exception as e:
        logger.error(f"Error while retrieving messages or conv {e}")
        HTTPException(status_code=404, detail=f"Error retrieving messages {e}")


@message_router.delete("/conversations/{other_user_id}")
async def delete_conversation(
    other_user_id: int, current_user: dict = Depends(get_current_user)
):
    try:
        user_id = current_user["id"]
        query = """
                DELETE FROM messages
                WHERE (sender_id = :user_id AND reciever_id = :other_user_id) 
                OR (sender_id = :other_user_id AND reciever_id = :user_id)
                """
        result = await db_connection.execute(
            query=query, values={"user_id": user_id, "other_user_id": other_user_id}
        )
        return {
            "message": "Conversation deleted successfully",
            "deleted_messages": result,
        }

    except Exception as e:
        logger.error(f"Error while deleting conversation: {e}")
        HTTPException(status_code=400, detail=f"Error while deleting conversation {e}")


@message_router.get("/conversations")
async def get_conversations(
    limit: int = 50, offset: int = 0, current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]

    try:
        query = """
            WITH last_messages AS (
                SELECT 
                    CASE 
                        WHEN sender_id = :user_id THEN reciever_id
                        ELSE sender_id
                    END AS other_user_id,
                    content AS last_message,
                    created_at AS last_message_time,
                    ROW_NUMBER() OVER (
                        PARTITION BY 
                            LEAST(sender_id, reciever_id),
                            GREATEST(sender_id, reciever_id)
                        ORDER BY created_at DESC
                    ) AS rn
                FROM messages
                WHERE sender_id = :user_id OR reciever_id = :user_id
            )
            SELECT
                lm.other_user_id,
                lm.last_message,
                lm.last_message_time,
                u.username
            FROM last_messages lm
            JOIN users u ON u.id = lm.other_user_id
            WHERE rn = 1
            ORDER BY last_message_time DESC
            LIMIT :limit OFFSET :offset;
        """

        rows = await db_connection.fetch_all(
            query=query,
            values={
                "user_id": user_id,
                "limit": limit,
                "offset": offset,
            },
        )

        return [
            {
                "other_user_id": r["other_user_id"],
                "username": r["username"],
                "last_message": r["last_message"],
                "last_message_time": r["last_message_time"],
            }
            for r in rows
        ]

    except Exception as e:
        logger.error(f"Error retrieving conversations: {e}")
        raise HTTPException(status_code=400, detail="Could not fetch conversations")
