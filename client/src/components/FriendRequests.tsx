import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFriendRequests } from "../api/fetchFriends";
import { acceptFriendRequest, rejectFriendRequest } from "../api/friends";
const FriendRequests: React.FC = () => {
  const queryClient = useQueryClient();
  const { mutate: acceptMutate, isPending: isAccepting } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendrequests"],
      });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });
  const { mutate: rejectMutate, isPending: isRejecting } = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friendrequests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["peopleyoumayknow"],
      });
    },
  });
  const {
    status,
    error,
    data: friendrequests,
  } = useQuery({
    queryKey: ["friendrequests"],
    queryFn: getFriendRequests,
  });

  const handleAcceptFriendRequest = (userId: number) => {
    if (!userId) {
      return;
    }
    acceptMutate(userId);
  };
  const handleRejectFriendRequest = (userId: number) => {
    if (!userId) {
      return;
    }
    rejectMutate(userId);
  };
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
          <button
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            onClick={() => handleAcceptFriendRequest(friendrequest.id)}
            disabled={isAccepting}
          >
            Accept
          </button>
          <button
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            onClick={() => handleRejectFriendRequest(friendrequest.id)}
            disabled={isRejecting}
          >
            Reject
          </button>
        </div>
      ))}
    </div>
  );
};

export default FriendRequests;
