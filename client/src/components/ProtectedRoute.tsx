import type { RootState } from "../store/store.ts";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "../store/hooks/hook.ts";
const ProtectedRoute = () => {
  const isAuthenticated = useAppSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const location = useLocation();

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default ProtectedRoute;
