import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPeopleYouMayKnow } from "../api/fetchFriends";
import { sendFriendRequest } from "../api/friends";
const PeopleYouMayKnow: React.FC = () => {
  const {
    status,
    error,
    data: peopleyoumayknow,
  } = useQuery({
    queryKey: ["peopleyoumayknow"],
    queryFn: getPeopleYouMayKnow,
    refetchOnMount: true,
  });
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["peopleyoumayknow"] });
    },
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
    mutate(userId);
  };
  return (
    <div>
      {peopleyoumayknow.map((person) => (
        <div key={person.id}>
          {person.username}
          {person.friendship_status}
          <button
            onClick={() => handleAddfriend(person.id)}
            disabled={isPending}
          >
            Add Friend
          </button>
        </div>
      ))}
    </div>
  );
};

export default PeopleYouMayKnow;
