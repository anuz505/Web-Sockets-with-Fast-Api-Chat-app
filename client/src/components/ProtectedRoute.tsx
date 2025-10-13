import type { RootState } from "../store/store.ts";
import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
const ProtectedRoute = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
