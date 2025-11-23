import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../api/fetchFriends";
const FriendRequests: React.FC = () => {
  const {
    status,
    error,
    data: friendrequests,
  } = useQuery({
    queryKey: ["friendrequests"],
    queryFn: getFriendRequests,
  });
  if (status == "pending") {
    return <div>Loading....</div>;
  }
  if (status == "error") {
    return <div>Error: {error.message}</div>;
  }
  if (!friendrequests || friendrequests.length === 0) {
    return <div>No Users</div>;
  }
  return (
    <div>
      {friendrequests.map((friendrequest) => (
        <div key={friendrequest.id}>
          {friendrequest.username}
          {friendrequest.friendship_status}
        </div>
      ))}
    </div>
  );
};

export default FriendRequests;
