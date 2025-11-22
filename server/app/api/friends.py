from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from models.friends import FriendShipResponse, FriendRequest, FriendsProfile
from api.auth import get_current_user
from core.logger import logger
from db.database import db_connection

friends_router = APIRouter(prefix="/friends", tags=["friends"])


@friends_router.post("/send_friend_request", response_model=FriendShipResponse)
async def send_friend_request(
    friend_request: FriendRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    try:
        if current_user["id"] == friend_request.id:
            raise HTTPException(
                status_code=400,
                detail="cannot send request to yourself or the current user",
            )
        check_friend_exists = await db_connection.fetch_one(
            query="""
                    SELECT id FROM users WHERE id = :user_id
                   """,
            values={"user_id": friend_request.id},
        )
        if not check_friend_exists:
            logger.error(f"The user does not exist {friend_request.id}")
            raise HTTPException(status_code=404, detail="The user does not exist")

        check_exists_query = """
                                SELECT * FROM friendships
                                WHERE (user_id = :user_id AND friend_id = :friend_id)
                                OR (friend_id= :user_id AND user_id = :friend_id)
                            """
        exists = await db_connection.fetch_one(
            query=check_exists_query,
            values={"user_id": current_user["id"], "friend_id": friend_request.id},
        )
        if exists:
            raise HTTPException(
                status_code=400,
                detail=f"Friend request already exists {exists['status']}",
            )

        try:
            query = """
                        INSERT INTO friendships (user_id,friend_id,status)
                        VALUES (:user_id,:friend_id,'pending')
                        RETURNING id,user_id,friend_id,status,created_at
                    """
            db_res = await db_connection.fetch_one(
                query=query,
                values={"user_id": current_user["id"], "friend_id": friend_request.id},
            )
            return FriendShipResponse(**dict(db_res))
        except Exception as e:
            logger.error(f"Failed to Insert {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to Insert in db")

    except Exception as e:
        logger.error(f"Failed to send a friend request {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to send a friend request")


@friends_router.patch("/accept/{friend_id}")  # note: path parameters must be scalar hai
async def accept_friendrequest(
    current_user: Annotated[dict, Depends(get_current_user)], friend_id: int
):
    try:
        if not current_user or not friend_id:
            raise HTTPException(
                status_code=404, detail="no user or friend with this id found"
            )

        query = """
                UPDATE friendships 
                SET status='accepted'
                WHERE user_id = :friend_id
                AND friend_id = :user_id
                AND status = 'pending'
                RETURNING id
                """
        res = await db_connection.fetch_one(
            query=query,
            values={"user_id": current_user["id"], "friend_id": friend_id},
        )
        if res:
            return {"success": True, "message": "Friend Request Accepted"}
        else:
            raise HTTPException(status_code=404, detail="Friend request not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to accept the friend request {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to accept friend request")


@friends_router.patch("/block/{friend_id}")
async def block_friend(
    current_user: Annotated[dict, Depends(get_current_user)], friend_id: int
):
    try:
        query = """
                    UPDATE friendships
                    SET status='blocked'
                    WHERE ((user_id = :user_id AND friend_id = :friend_id)
                        OR (user_id = :friend_id AND friend_id = :user_id))
                    AND status='accepted'
                    RETURNING id
                """
        response = await db_connection.fetch_one(
            query=query,
            values={"user_id": current_user["id"], "friend_id": friend_id},
        )
        if not response:
            raise HTTPException(
                status_code=404, detail="No accepted friendship found to block"
            )
        else:
            return {"success": True, "message": f"sucessfully blocked"}
    except Exception as e:
        logger.error(f"Error Blocking friend {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to Block a friends")


@friends_router.get("/allfriends", response_model=list[FriendsProfile])
async def get_all_friends(current_user: Annotated[dict, Depends(get_current_user)]):
    try:
        query = """
                    SELECT
                        u.id,
                        u.username,
                        f.status as friendship_status,
                        f.created_at as friendship_created_at
                    FROM friendships f 
                    JOIN users u ON (
                        CASE 
                            WHEN f.user_id = :user_id THEN u.id = f.friend_id
                            ELSE u.id = f.user_id
                        END
                    )
                    WHERE (f.user_id = :user_id OR f.friend_id = :user_id) 
                    AND f.status = 'accepted'
                """
        friends = await db_connection.fetch_all(
            query=query, values={"user_id": current_user["id"]}
        )
        return [FriendsProfile(**friend) for friend in friends]

    except Exception as e:
        logger.error(f"Error fetching friends {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch friends")


@friends_router.delete("/removefriend/{friend_id}")
async def remove_friend(
    current_user: Annotated[dict, Depends(get_current_user)], friend_id: int
):
    try:
        query = """
                    DELETE FROM friendships
                    WHERE ((user_id =:user_id AND friend_id = :friend_id)
                    OR (user_id = :friend_id AND friend_id = :user_id))
                    AND status IN ('pending','blocked')
                    RETURNING id
                """
        response = await db_connection.fetch_one(
            query=query, values={"user_id": current_user["id"], "friend_id": friend_id}
        )
        if not response:
            logger.error("Error deleting friend", exc_info=True)
            raise HTTPException(status_code=400, detail="Error in removing friend")
        else:
            return {"success": True, "message": "Friend Removed"}

    except Exception as e:
        logger.error(f"Error Deleting friend {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to Remove friend")


@friends_router.get("/peopleyoumayknow", response_model=list[FriendsProfile])
async def people_you_may_know(current_user: Annotated[dict, Depends(get_current_user)]):
    try:
        query = """
                    SELECT id, username, 'pending' as friendship_status, NOW() as friendship_created_at 
                    FROM users
                    WHERE id != :user_id
                    AND id NOT IN (
                        SELECT friend_id FROM friendships WHERE user_id = :user_id
                        UNION
                        SELECT user_id FROM friendships WHERE friend_id = :user_id
                    )
                    
                    
                """
        people = await db_connection.fetch_all(
            query=query, values={"user_id": current_user["id"]}
        )
        return [FriendsProfile(**person) for person in people]

    except Exception as e:
        logger.error(f"Something went wrong in fetching people you may know{e}")
        raise HTTPException(
            status_code=400,
            detail="Something went wrong in fetching people you may know",
        )


@friends_router.get("/friendrequests", response_model=list[FriendsProfile])
async def all_friend_requests(current_user: Annotated[dict, Depends(get_current_user)]):
    try:
        query = """
                    SELECT 
                        u.id,
                        u.username,
                        f.status as friendship_status,
                        f.created_at as friendship_created_at
                    FROM friendships f
                    JOIN users u ON u.id = f.user_id
                    WHERE f.friend_id = :user_id
                    AND f.status = 'pending'
                    ORDER BY f.created_at DESC
               """
        friend_requests = await db_connection.fetch_all(
            query=query, values={"user_id": current_user["id"]}
        )
        return [FriendsProfile(**friend_request) for friend_request in friend_requests]
    except Exception as e:
        logger.error(f"Something went wrong fetching friendrequests: {e}")
        raise HTTPException(
            status_code=400, detail="Something went wrong fetching friendrequests"
        )
