import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllConversations } from "../api/conversations.ts";
import Loader from "./common/Loader.tsx";
import { HiArrowLeft } from "react-icons/hi2";
import type { ConversationType } from "../types/conversations-types.ts";
import { useWebSocket } from "../hooks/Websocket.ts";

const Conversation: React.FC = () => {
  const {
    status,
    error: queryError,
    data: conversations,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: getAllConversations,
  });
  const [selectedConversation, setselectedConversation] =
    useState<ConversationType | null>(null);
  const [showConversation, setShowConversation] = useState(false);
  const token = localStorage.getItem("access_token");
  const {
    isAuthenticated,
    user,
    error: wsError,
    sendMessage,
    message,
    connectionStatus,
  } = useWebSocket(token);
  const [inputMessage, setInputMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  const handleFriendClick = (conversation: ConversationType) => {
    setselectedConversation(conversation);
    setShowConversation(true);
  };

  const handleBackToList = () => {
    setShowConversation(false);
    setselectedConversation(null);
  };
  const conversationMessages = message.filter(
    (msg) =>
      (msg.sender_id === user?.id &&
        msg.reciever_id === selectedConversation?.other_user_id) ||
      (msg.sender_id === selectedConversation?.other_user_id &&
        msg.reciever_id === user?.id)
  );
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [message]);
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isAuthenticated || !selectedConversation) {
      return;
    }
    sendMessage(selectedConversation?.other_user_id, inputMessage.trim());
    setInputMessage("");
  };
  if (status === "pending") {
    return <Loader />;
  }
  if (status === "error") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-500">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-600">{queryError.message}</p>
        </div>
      </div>
    );
  }
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
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
            No Conversations Yet
          </h2>
          <p className="mt-2 text-gray-500">Start connecting with people!</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar with friends list - Hidden on mobile when conversation is shown */}
      <div
        className={`${
          showConversation ? "hidden" : "flex"
        } md:flex w-full md:w-80 border-r border-gray-200 flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-500">
            {conversations.length} friends
          </p>
        </div>

        {/* Converstaions list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.other_user_id}
              onClick={() => handleFriendClick(conversation)}
              className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-100 ${
                conversation?.other_user_id === conversation.other_user_id
                  ? "bg-blue-50"
                  : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                    {conversation.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {conversation.username}
                  </p>
                </div>
              </div>
            </div>
          ))}
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
            {/* Conversation Header with Back Button (Mobile only) */}
            <div className="md:hidden p-4 bg-white border-b border-gray-200 flex items-center space-x-3">
              <button
                onClick={handleBackToList}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <HiArrowLeft className="h-6 w-6 text-gray-700" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {selectedConversation.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedConversation.username}
                  </p>
                  <p className="text-xs text-gray-500">Active Now</p>
                </div>
              </div>
            </div>
            {/* here i need to  */}
            <div className="px-6 py-4 bg-gray-50">
              {conversationMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No messages yet. Start the convo</p>
                </div>
              ) : (
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
                          className={`max-ws-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
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
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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
              )}
            </div>

            {/* inputForm */}
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    isAuthenticated ? "type a message" : "connecting..."
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
  );
};

export default Conversation;
