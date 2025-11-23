import React from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks/hook";
import { fetchFriendRequests } from "../store/friends-slice";
const PeopleYouMayKnow: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading, error, friendRequests } = useAppSelector(
    (state) => state.friends
  );
  React.useEffect(() => {
    dispatch(fetchFriendRequests());
  }, [dispatch]);
  if (loading) {
    return <div>Loading....</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  if (!loading && friendRequests.length === 0) {
    return <div>No Users</div>;
  }
  return (
    <div>
      {friendRequests.map((friendrequest) => (
        <div key={friendrequest.id}>
          {friendrequest.username}
          {friendrequest.friendship_status}
        </div>
      ))}
    </div>
  );
};

export default PeopleYouMayKnow;
