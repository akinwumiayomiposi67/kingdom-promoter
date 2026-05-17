import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function AdminRoute() {
  const { token, role } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (role === "member") return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
