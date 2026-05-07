import { useAuthStore } from '../../store/authStore';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-2">Member Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
        <p className="text-sm text-gray-400 mt-4">Phase 2+ features coming soon.</p>
      </div>
    </div>
  );
}
