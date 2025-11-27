import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFriendRequests } from "../api/fetchFriends";
import { acceptFriendRequest, rejectFriendRequest } from "../api/friends";
import Loader from "./common/Loader";
import { HiCheck, HiXMark } from "react-icons/hi2";

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

  if (status === "pending") {
    return <Loader />;
  }

  if (status === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-4 px-4">
          <div className="w-16 h-16 border-2 border-red-500 mx-auto flex items-center justify-center">
            <HiXMark className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="font-bebas text-2xl tracking-wider text-gray-900">
            ERROR
          </h2>
          <p className="text-gray-600 font-light">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!friendrequests || friendrequests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-6 px-4">
          <div className="w-20 h-20 border-2 border-gray-300 mx-auto flex items-center justify-center">
            <span className="font-bebas text-3xl text-gray-300">00</span>
          </div>
          <div className="space-y-2">
            <h2 className="font-bebas text-3xl tracking-wider text-gray-900">
              NO REQUESTS
            </h2>
            <div className="w-16 h-px bg-gray-300 mx-auto"></div>
            <p className="text-gray-500 font-light">
              Your inbox is empty. For now.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 sm:px-6 md:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="font-bebas text-4xl sm:text-5xl md:text-6xl tracking-wider">
            FRIEND REQUESTS
          </h1>
          <div className="w-16 h-px bg-black mx-auto"></div>
          <p className="text-gray-600 font-light tracking-wide">
            {friendrequests.length} PENDING{" "}
            {friendrequests.length === 1 ? "REQUEST" : "REQUESTS"}
          </p>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {friendrequests.map((friendrequest, index) => (
            <div
              key={friendrequest.id}
              className="border-2 border-black p-6 hover:bg-gray-50 transition-colors duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 border-2 border-black flex items-center justify-center flex-shrink-0">
                    <span className="font-bebas text-xl">
                      {friendrequest.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bebas text-xl tracking-wider">
                      {friendrequest.username}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {friendrequest.friendship_status}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 sm:gap-4">
                  <button
                    onClick={() => handleAcceptFriendRequest(friendrequest.id)}
                    disabled={isAccepting || isRejecting}
                    className="group flex-1 sm:flex-none bg-black text-white px-6 py-3 font-bebas text-sm tracking-wider hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <HiCheck className="h-5 w-5" />
                    ACCEPT
                    <div className="w-0 group-hover:w-full h-px bg-white transition-all duration-300 absolute bottom-2 left-0"></div>
                  </button>

                  <button
                    onClick={() => handleRejectFriendRequest(friendrequest.id)}
                    disabled={isAccepting || isRejecting}
                    className="flex-1 sm:flex-none border-2 border-black text-black px-6 py-3 font-bebas text-sm tracking-wider hover:bg-black hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <HiXMark className="h-5 w-5" />
                    DECLINE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FriendRequests;
