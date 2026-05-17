import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function MemberRoute() {
  const { token, role } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin/dashboard" replace />;

  return <Outlet />;
}
