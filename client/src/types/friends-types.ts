export interface FriendsProfile {
  id: number;
  username: string;
  friendship_status: string;
  friendship_created_at: string;
}
interface FriendsState {
  friends: FriendsProfile[];
  peopleYouMayKnow: FriendsProfile[];
  friendRequests: FriendsProfile[];
  loading: boolean;
  error: null | string;
}
export const initialState: FriendsState = {
  friends: [],
  peopleYouMayKnow: [],
  friendRequests: [],
  loading: false,
  error: null,
};
