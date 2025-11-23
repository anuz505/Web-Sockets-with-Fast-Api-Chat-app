import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getPeopleYouMayKnow } from "../api/fetchFriends";
const PeopleYouMayKnow: React.FC = () => {
  const {
    status,
    error,
    data: peopleyoumayknow,
  } = useQuery({
    queryKey: ["peopleyoumayknow"],
    queryFn: getPeopleYouMayKnow,
  });
  if (status == "pending") {
    return <div>Loading....</div>;
  }
  if (status == "error") {
    return <div>Error: {error.message}</div>;
  }
  if (!peopleyoumayknow || peopleyoumayknow.length === 0) {
    return <div>No Users</div>;
  }
  const handleAddfriend = (userId: number) => {
    if (!userId) {
      return;
    }
    // TODO patch route to send Friend Request http://localhost:8000/friends/sendfriendrequest
  };
  return (
    <div>
      {peopleyoumayknow.map((person) => (
        <div key={person.id}>
          {person.username}
          {person.friendship_status}
          <button>Add Friend</button>
        </div>
      ))}
    </div>
  );
};

export default PeopleYouMayKnow;
