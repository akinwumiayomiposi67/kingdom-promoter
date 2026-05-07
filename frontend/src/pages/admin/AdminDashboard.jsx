import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);

  const { data: cyclesData } = useQuery({
    queryKey: ['admin-cycles-dashboard'],
    queryFn: () =>
      import('../../api/axios').then(({ default: api }) =>
        api.get('/admin/cycles').then((r) => r.data.data.cycles)
      ),
  });

  const { data: disbursementsData } = useQuery({
    queryKey: ['admin-disbursements-dashboard'],
    queryFn: () =>
      import('../../api/axios').then(({ default: api }) =>
        api.get('/admin/disbursements').then((r) => r.data.data.disbursements)
      ),
  });

  const cycles = cyclesData ?? [];
  const disbursements = disbursementsData?.data ?? [];

  const completedCycles = cycles.filter((c) => c.status === 'completed');
  const disbursedCycleIds = new Set(disbursements.map((d) => d.contribution_cycle_id));
  const cyclesWithoutDisbursement = completedCycles.filter((c) => !disbursedCycleIds.has(c.id));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#1a3c6e' }}>Admin Dashboard</h1>
        <p className="text-gray-600 mb-6">Welcome, {user?.name}!</p>

        {cyclesWithoutDisbursement.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 mb-6">
            <p className="text-sm font-semibold text-amber-800">
              ⚠️ {cyclesWithoutDisbursement.length} completed cycle
              {cyclesWithoutDisbursement.length > 1 ? 's have' : ' has'} no disbursement recorded.
            </p>
            <ul className="mt-1 list-disc list-inside text-sm text-amber-700">
              {cyclesWithoutDisbursement.map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
            <Link
              to="/admin/disbursements"
              className="inline-block mt-2 text-sm font-medium underline text-amber-700 hover:text-amber-900"
            >
              Go to Disbursements →
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link
            to="/admin/disbursements"
            className="block bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <p className="text-sm uppercase tracking-wide text-gray-500">Disbursements</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#1a3c6e' }}>
              {disbursements.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {disbursements.filter((d) => d.is_published).length} published
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
