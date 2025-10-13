import type { RootState } from "../store/store.ts";
import { Navigate, Outlet } from "react-router";
import { useAppSelector } from "../store/hooks/hook.ts";
const ProtectedRoute = () => {
  const isAuthenticated = useAppSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
