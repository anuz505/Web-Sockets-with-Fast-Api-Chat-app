import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllConversations,
  retrieverChatHistory,
} from "../api/conversations.ts";
import { getFriends } from "../api/fetchFriends.ts";
import type { FriendsProfile } from "../types/friends-types.ts";
import Loader from "./common/Loader.tsx";
import { HiArrowLeft } from "react-icons/hi2";
import type {
  ConversationType,
  Message,
} from "../types/conversations-types.ts";
import { useWebSocket } from "../hooks/Websocket.ts";
import Navbar from "./common/Navbar.tsx";
const Conversation: React.FC = () => {
  const queryClient = useQueryClient();

  // list of conversations
  const {
    status: listConvStatus,
    error: queryError,
    data: conversations,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: getAllConversations,
  });

  const {
    status: friendsStatus,
    error: friendsError,
    data: friends,
  } = useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
    enabled: true,
  });

  const [selectedConversation, setselectedConversation] =
    useState<ConversationType | null>(null);
  const [showConversation, setShowConversation] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  // websocket hook
  const {
    isAuthenticated,
    user,
    error: wsError,
    sendMessage,
    message: wsMessages,
    connectionStatus,
  } = useWebSocket();

  // retrieve chat history
  const {
    status: chatHistoryStatus,
    error: chatHistoryError,
    data: chatHistory,
  } = useQuery({
    queryKey: ["chatHistory", selectedConversation?.other_user_id],
    queryFn: ({ queryKey }) => retrieverChatHistory(queryKey[1] as number),
    enabled: !!selectedConversation,
  });

  // Merge chat history with WebSocket messages
  const conversationMessages = useMemo(() => {
    if (!selectedConversation || !user) return [];

    // Get historical messages
    const historical = chatHistory || [];

    // Get WebSocket messages for this conversation
    const wsConversationMessages = wsMessages.filter(
      (msg) =>
        (msg.sender_id === user.id &&
          msg.reciever_id === selectedConversation.other_user_id) ||
        (msg.sender_id === selectedConversation.other_user_id &&
          msg.reciever_id === user.id)
    );

    // Merge and deduplicate based on message ID
    const messageMap = new Map<number, Message>();

    historical.forEach((msg) => {
      if (msg.id) {
        messageMap.set(msg.id, msg);
      }
    });

    wsConversationMessages.forEach((msg) => {
      if (msg.id) {
        messageMap.set(msg.id, msg);
      }
    });

    return Array.from(messageMap.values()).sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [chatHistory, wsMessages, selectedConversation, user]);

  // ui
  const [inputMessage, setInputMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  // action buttons func
  const handleFriendClick = (conversation: ConversationType) => {
    setselectedConversation(conversation);
    setShowConversation(true);
  };

  const handleStartChatWithFriend = (friend: FriendsProfile) => {
    setselectedConversation({
      other_user_id: friend.id,
      username: friend.username,
      last_message: "",
      last_message_time: new Date(),
    });
    setShowConversation(true);
    setShowNewChatModal(false);
  };

  const handleBackToList = () => {
    setShowConversation(false);
    setselectedConversation(null);
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);

  // Invalidate conversations when new WebSocket messages arrive - DEBOUNCED
  useEffect(() => {
    if (wsMessages.length > 0) {
      // Debounce the invalidation to avoid excessive refetches
      const timeoutId = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [wsMessages.length, queryClient]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isAuthenticated || !selectedConversation) {
      return;
    }
    sendMessage(selectedConversation.other_user_id, inputMessage.trim());
    setInputMessage("");
  };

  if (listConvStatus === "pending") {
    return <Loader text="chats" />;
  }

  if (listConvStatus === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-500">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-600">{queryError.message}</p>
        </div>
      </div>
    );
  }

  // no conversations - show friends list instead
  if ((!conversations || conversations.length === 0) && !selectedConversation) {
    if (friendsStatus === "pending") return <Loader text="friends" />;

    if (friendsStatus === "error") {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-red-600">
              Error loading friends
            </h2>
            <p className="mt-2 text-gray-500">{friendsError?.message}</p>
          </div>
        </div>
      );
    }

    // Show friends list
    return (
      <div className="flex h-screen flex-col">
        <Navbar />

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900">Start a Chat</h2>
          <p className="text-gray-500 mt-1">
            Select a friend to begin messaging.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {friends && friends.length > 0 ? (
            friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => handleStartChatWithFriend(friend)}
                className="p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-black text-white flex items-center justify-center rounded-full font-semibold text-lg">
                    {friend.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {friend.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      Click to start chatting
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg
                  className="mx-auto h-24 w-24 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h2 className="mt-4 text-2xl font-semibold text-gray-700">
                  No Friends Yet
                </h2>
                <p className="mt-2 text-gray-500">
                  Add friends to start chatting!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex h-screen bg-white">
        <div
          className={`${
            showConversation ? "hidden" : "flex"
          } md:flex w-full md:w-80 border-r border-gray-200 flex-col`}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                title="New Chat"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {conversations && conversations.length > 0
                ? `${conversations.length} conversation${
                    conversations.length !== 1 ? "s" : ""
                  }`
                : "Start a new chat"}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations && conversations.length > 0 ? (
              // Show conversations list
              conversations.map((conversation) => (
                <div
                  key={conversation.other_user_id}
                  onClick={() => handleFriendClick(conversation)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-100 ${
                    selectedConversation?.other_user_id ===
                    conversation.other_user_id
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-white font-semibold text-lg">
                        {conversation.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {conversation.username}
                      </p>
                      {conversation.last_message && (
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.last_message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : friendsStatus === "pending" ? (
              <div className="flex items-center justify-center h-full">
                <Loader text="friends" />
              </div>
            ) : friends && friends.length > 0 ? (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => handleStartChatWithFriend(friend)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-100 ${
                    selectedConversation?.other_user_id === friend.id
                      ? "bg-blue-50"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-white font-semibold text-lg">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {friend.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        Click to start chatting
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // No friends
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                  <p className="text-gray-500">No friends to chat with</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conversation area - Full screen on mobile when friend is selected */}
        <div
          className={`${
            showConversation ? "flex" : "hidden md:flex"
          } flex-1 flex-col bg-gray-50`}
        >
          {selectedConversation ? (
            <>
              {/* Conversation Header - Desktop and Mobile */}
              <div className="p-4 bg-white border-b border-gray-200 flex items-center space-x-3">
                {/* Back Button (Mobile only) */}
                <button
                  onClick={handleBackToList}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <HiArrowLeft className="h-6 w-6 text-gray-700" />
                </button>

                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white font-semibold">
                    {selectedConversation.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedConversation.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {connectionStatus === "authenticated"
                        ? "Active Now"
                        : "Connecting..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 flex flex-col">
                {chatHistoryStatus === "pending" ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader text="messages" />
                  </div>
                ) : chatHistoryError ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-red-500">Error loading messages</p>
                  </div>
                ) : conversationMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-end">
                    <div className="space-y-4">
                      {conversationMessages.map((msg) => {
                        const isSentByMe = msg.sender_id === user?.id;

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${
                              isSentByMe ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                                isSentByMe
                                  ? "bg-black text-white rounded-br-none"
                                  : "bg-white text-gray-800 rounded-bl-none"
                              }`}
                            >
                              <p className="break-words">{msg.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isSentByMe ? "text-blue-200" : "text-gray-500"
                                }`}
                              >
                                {new Date(msg.created_at).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                                {isSentByMe && (
                                  <span className="ml-2">
                                    {msg.is_read ? "✓✓" : "✓"}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messageEndRef} />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={
                      isAuthenticated ? "Type a message..." : "Connecting..."
                    }
                    disabled={!isAuthenticated}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={!isAuthenticated || !inputMessage.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="mx-auto h-24 w-24 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h3 className="mt-4 text-xl font-medium text-gray-700">
                  Select a conversation
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Choose a friend to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowNewChatModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">New Chat</h2>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body - Friends List */}
            <div className="flex-1 overflow-y-auto p-4">
              {friendsStatus === "pending" ? (
                <div className="flex items-center justify-center py-8">
                  <Loader text="friends" />
                </div>
              ) : friendsStatus === "error" ? (
                <div className="text-center py-8">
                  <p className="text-red-500">Error loading friends</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {friendsError?.message}
                  </p>
                </div>
              ) : friends && friends.length > 0 ? (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      onClick={() => handleStartChatWithFriend(friend)}
                      className="p-3 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-3"
                    >
                      <div className="h-10 w-10 bg-black text-white flex items-center justify-center rounded-full font-semibold">
                        {friend.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {friend.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          Click to start chatting
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="mt-4 text-gray-600 font-medium">
                    No Friends Yet
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Add friends to start chatting!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Conversation;
