export interface FriendsProfile {
  id: number;
  username: string;
  friendship_status: string;
  friendship_created_at: string;
}

export interface FriendShipResponse {
  id: number;
  user_id: number;
  friend_id: string;
  created_at: Date;
}
