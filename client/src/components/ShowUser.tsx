// testing auth

import React from "react";
import { logoutUser } from "../store/auth-slice";
import { useAppSelector, useAppDispatch } from "../store/hooks/hook";
const ShowUser = () => {
  const { user, isAuthenticated, isLoading } = useAppSelector(
    (state) => state.auth
  );
  const dispatch = useAppDispatch();
  const handleLogout = () => {
    dispatch(logoutUser());
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (!isAuthenticated || !user) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">No user information available</p>
      </div>
    );
  }
  return (
    <div className="max-w-md mx-auto bg-card rounded-lg shadow-md p-6 space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          User Profile
        </h2>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
          <span className="font-medium text-muted-foreground">Username:</span>
          <span className="text-foreground">{user.username}</span>
        </div>

        {user.email && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <span className="font-medium text-muted-foreground">Email:</span>
            <span className="text-foreground">{user.email}</span>
          </div>
        )}

        {user.id && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <span className="font-medium text-muted-foreground">User ID:</span>
            <span className="text-foreground font-mono text-sm">{user.id}</span>
          </div>
        )}
      </div>
      <div className="pt-4 border-t">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
        </div>
      </div>
      <div className="pt-4">
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>{" "}
    </div>
  );
};

export default ShowUser;
