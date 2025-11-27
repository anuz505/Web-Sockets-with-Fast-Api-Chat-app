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

  const handleAddfriend = (userId: number) => {
    if (!userId) {
      return;
    }
    mutate(userId);
  };

  if (status === "pending") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-2 border-black mx-auto flex items-center justify-center animate-pulse">
            <span className="font-bebas text-2xl">...</span>
          </div>
          <p className="font-bebas text-xl tracking-wider text-gray-600">
            LOADING
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 border-2 border-red-500 mx-auto flex items-center justify-center">
            <span className="font-bebas text-2xl text-red-500">!</span>
          </div>
          <h2 className="font-bebas text-2xl tracking-wider">ERROR</h2>
          <p className="text-gray-600 font-light">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!peopleyoumayknow || peopleyoumayknow.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-px bg-gray-300 mx-auto"></div>
          <h2 className="font-bebas text-3xl sm:text-4xl tracking-wider">
            NO SUGGESTIONS
          </h2>
          <p className="text-gray-600 font-light text-lg">
            Looks like you've already found everyone worth finding.
          </p>
          <div className="w-20 h-px bg-gray-300 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 sm:px-6 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 sm:space-y-6 mb-12 sm:mb-16">
          <h1 className="font-bebas text-4xl sm:text-5xl md:text-6xl tracking-wider">
            PEOPLE YOU <span className="text-gray-400">MAY KNOW</span>
          </h1>
          <div className="w-16 sm:w-20 md:w-24 h-px bg-black mx-auto"></div>
          <p className="text-base sm:text-lg text-gray-600 font-light tracking-wide">
            EXPAND YOUR CIRCLE OF SARCASM
          </p>
        </div>

        {/* People Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {peopleyoumayknow.map((person, index) => (
            <div
              key={person.id}
              className="border-2 border-black p-6 space-y-4 hover:bg-gray-50 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* User Avatar/Initial */}
              <div className="w-16 h-16 border-2 border-black mx-auto flex items-center justify-center">
                <span className="font-bebas text-2xl">
                  {person.username.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Username */}
              <div className="text-center space-y-2">
                <h3 className="font-bebas text-xl tracking-wider truncate">
                  {person.username}
                </h3>
                <div className="w-8 h-px bg-gray-300 mx-auto"></div>
              </div>

              {/* Add Friend Button */}
              <button
                onClick={() => handleAddfriend(person.id)}
                disabled={isPending}
                className="w-full bg-black text-white py-3 font-bebas text-lg tracking-wider hover:bg-gray-800 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed group"
              >
                {isPending ? "SENDING..." : "ADD FRIEND"}
                <div className="w-0 group-hover:w-full h-px bg-white transition-all duration-300 mx-auto mt-1"></div>
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Decoration */}
        <div className="flex items-center justify-center space-x-3 sm:space-x-4 mt-12 sm:mt-16">
          <div className="w-12 sm:w-16 h-px bg-gray-300"></div>
          <span className="text-gray-400 text-xs sm:text-sm">●</span>
          <div className="w-12 sm:w-16 h-px bg-gray-300"></div>
        </div>
      </div>
    </div>
  );
};

export default PeopleYouMayKnow;
