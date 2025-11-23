export interface FriendsProfile {
  id: number;
  username: string;
  friendship_status: string;
  friendship_created_at: string;
}
interface FriendsState {
  loading: boolean;
  error: null | string;
}
export const initialState: FriendsState = {
  loading: false,
  error: null,
};
