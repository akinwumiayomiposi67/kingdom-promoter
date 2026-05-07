import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import ProtectedRoute from './ProtectedRoute';

export default function MemberRoute({ children }) {
  const role = useAuthStore((state) => state.role);

  return (
    <ProtectedRoute>
      {role === 'admin' ? (
        <Navigate to="/admin/dashboard" replace />
      ) : (
        children
      )}
    </ProtectedRoute>
  );
}
