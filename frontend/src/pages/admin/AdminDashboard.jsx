import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getDashboardStats } from '../../api/admin';
import formatCurrency from '../../utils/formatCurrency';

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => getDashboardStats().then((r) => r.data.data),
    refetchInterval: 60_000,
  });

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

  const stats = statsData ?? {};

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#1a3c6e' }}>Admin Dashboard</h1>
        <p className="text-gray-600 mb-6">Welcome, {user?.name}!</p>

        {/* Failed jobs warning */}
        {stats.failed_jobs_count > 0 && (
          <div className="bg-red-50 border border-red-300 rounded-xl px-5 py-4 mb-6">
            <p className="text-sm font-semibold text-red-800">
              🚨 {stats.failed_jobs_count} failed job{stats.failed_jobs_count > 1 ? 's' : ''} in the queue.
              Please check the failed_jobs table.
            </p>
          </div>
        )}

        {/* Undisbursed cycle alert */}
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

        {/* Stats cards */}
        {statsLoading ? (
          <p className="text-gray-500 text-sm mb-6">Loading stats…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <p className="text-sm uppercase tracking-wide text-gray-500">Active Members</p>
              <p className="text-3xl font-bold mt-1" style={{ color: '#1a3c6e' }}>
                {stats.total_members ?? '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <p className="text-sm uppercase tracking-wide text-gray-500">Total Wallet Balance</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#1a3c6e' }}>
                {stats.total_wallet_balance != null
                  ? formatCurrency(stats.total_wallet_balance)
                  : '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <p className="text-sm uppercase tracking-wide text-gray-500">Contributions Paid</p>
              <p className="text-3xl font-bold mt-1 text-green-600">
                {stats.current_cycle_contributions_paid ?? '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1">This cycle</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <p className="text-sm uppercase tracking-wide text-gray-500">Contributions Pending</p>
              <p className="text-3xl font-bold mt-1 text-amber-500">
                {stats.current_cycle_contributions_pending ?? '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1">This cycle</p>
            </div>
          </div>
        )}

        {/* Active cycle info */}
        {stats.active_cycle && (
          <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 mb-8">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Active Cycle</p>
            <p className="text-lg font-bold" style={{ color: '#1a3c6e' }}>{stats.active_cycle.name}</p>
            <p className="text-xs text-gray-400">
              {stats.active_cycle.start_date} → {stats.active_cycle.end_date}
            </p>
          </div>
        )}

        {/* Quick links */}
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
          <Link
            to="/admin/members"
            className="block bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <p className="text-sm uppercase tracking-wide text-gray-500">Members</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#1a3c6e' }}>
              {stats.total_members ?? '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Active members</p>
          </Link>
          <Link
            to="/admin/reports"
            className="block bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <p className="text-sm uppercase tracking-wide text-gray-500">Reports</p>
            <p className="text-lg font-bold mt-1" style={{ color: '#1a3c6e' }}>Download CSV / PDF</p>
          </Link>
          <Link
            to="/admin/settings"
            className="block bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <p className="text-sm uppercase tracking-wide text-gray-500">Settings</p>
            <p className="text-lg font-bold mt-1" style={{ color: '#1a3c6e' }}>Profile & 2FA</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
