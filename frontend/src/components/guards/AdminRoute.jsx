import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import ProtectedRoute from './ProtectedRoute';

export default function AdminRoute({ children }) {
  const role = useAuthStore((state) => state.role);

  return (
    <ProtectedRoute>
      {role === 'member' ? (
        <Navigate to="/dashboard" replace />
      ) : (
        children
      )}
    </ProtectedRoute>
  );
}
