import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getFriends } from "../api/fetchFriends";
import Loader from "./common/Loader";
import { HiXMark } from "react-icons/hi2";

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
    return <Loader text="friends" />;
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

  if (!friends || friends.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-6 px-4">
          <div className="w-20 h-20 border-2 border-gray-300 mx-auto flex items-center justify-center">
            <span className="font-bebas text-3xl text-gray-300">00</span>
          </div>
          <div className="space-y-2">
            <h2 className="font-bebas text-3xl tracking-wider text-gray-900">
              NO Friends
            </h2>
            <div className="w-16 h-px bg-gray-300 mx-auto"></div>
            <p className="text-gray-500 font-light">Bruhh Socialize</p>
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
            FRIENDs
          </h1>
          <div className="w-16 h-px bg-black mx-auto"></div>
          <p className="text-gray-600 font-light tracking-wide">
            {friends.length} PENDING{" "}
            {friends.length === 1 ? "REQUEST" : "REQUESTS"}
          </p>
        </div>

        {/* Friends List */}
        <div className="space-y-4">
          {friends.map((friend, index) => (
            <div
              key={friend.id}
              className="border-2 border-black p-6 hover:bg-gray-50 transition-colors duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 border-2 border-black flex items-center justify-center flex-shrink-0">
                    <span className="font-bebas text-xl">
                      {friend.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bebas text-xl tracking-wider">
                      {friend.username}
                    </h3>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {friend.friendship_status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyFriends;
