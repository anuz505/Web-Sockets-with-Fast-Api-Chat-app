import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getFriends } from "../api/fetchFriends";
const MyFriends: React.FC = () => {
  const {
    status,
    error,
    data: friends,
  } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
  });
  if (status === "pending") {
    return <h1>Loading bitch</h1>;
  }
  if (status === "error") {
    return <h1>Error: {error.message}</h1>;
  }
  if (!friends || friends.length === 0) {
    return <h1>No Friends</h1>;
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
