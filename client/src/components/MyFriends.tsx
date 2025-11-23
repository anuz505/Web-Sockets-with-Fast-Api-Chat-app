import React from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks/hook";
import { AllFriends } from "../store/friends-slice";
const MyFriends: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error, friends } = useAppSelector((state) => state.friends);
  React.useEffect(() => {
    dispatch(AllFriends());
  }, [dispatch]);
  if (loading) {
    return <div>Loading....</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  return (
    <div>
      {friends.map((friend) => (
        <div key={friend.id}>
          {friend.username}
          {friend.friendship_status}
        </div>
      ))}
    </div>
  );
};

export default MyFriends;
