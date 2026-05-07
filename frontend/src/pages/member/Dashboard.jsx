import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getWallet } from '../../api/wallet';
import { getMyContributions, getGroupContributions } from '../../api/contributions';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/ui/Badge';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet().then((r) => r.data.data.wallet),
  });

  const { data: myContributions } = useQuery({
    queryKey: ['my-contributions', 1],
    queryFn: () => getMyContributions(1).then((r) => r.data.data),
  });

  const { data: groupData } = useQuery({
    queryKey: ['group-contributions', 1],
    queryFn: () => getGroupContributions(1).then((r) => r.data.data),
  });

  const latestContribution = myContributions?.data?.[0];
  const cycle = groupData?.cycle;
  const groupContributions = groupData?.contributions?.data ?? [];
  const paidCount = groupContributions.filter((c) => c.status === 'paid').length;
  const totalMembers = groupData?.contributions?.total ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a3c6e' }}>
          Member Dashboard
        </h1>
        <p className="text-gray-600 mb-6">Welcome back, {user?.name}!</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Wallet summary card */}
          <div
            className="rounded-xl p-6 text-white shadow-md"
            style={{ backgroundColor: '#1a3c6e' }}
          >
            <p className="text-sm uppercase tracking-wide opacity-80">Wallet Balance</p>
            {walletLoading ? (
              <p className="text-2xl font-bold mt-1 opacity-60">Loading…</p>
            ) : (
              <>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(wallet?.balance ?? 0)}
                </p>
                {wallet?.virtual_account_number && (
                  <p className="text-sm opacity-70 mt-2">
                    {wallet.virtual_account_bank} — {wallet.virtual_account_number}
                  </p>
                )}
              </>
            )}
            <Link
              to="/wallet"
              className="inline-block mt-4 text-sm underline opacity-80 hover:opacity-100"
            >
              View wallet &rarr;
            </Link>
          </div>

          {/* Contribution status card */}
          <div className="rounded-xl p-6 bg-white shadow-md border border-gray-100">
            <p className="text-sm uppercase tracking-wide text-gray-500">My Contribution</p>
            {latestContribution ? (
              <>
                <p className="text-xl font-bold mt-1" style={{ color: '#1a3c6e' }}>
                  {formatCurrency(latestContribution.amount)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {latestContribution.cycle?.name} · {latestContribution.package?.name}
                </p>
                <div className="mt-2">
                  <Badge status={latestContribution.status} />
                </div>
              </>
            ) : (
              <div className="mt-2">
                <p className="text-gray-400 text-sm">No active contribution.</p>
                <Link
                  to="/onboarding"
                  className="inline-block mt-2 text-sm font-semibold underline"
                  style={{ color: '#f59e0b' }}
                >
                  Choose a package →
                </Link>
              </div>
            )}
            <Link
              to="/contributions"
              className="inline-block mt-4 text-sm underline opacity-70 hover:opacity-100"
              style={{ color: '#1a3c6e' }}
            >
              View all contributions &rarr;
            </Link>
          </div>
        </div>

        {/* Group stats card */}
        {cycle && (
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500">Group — {cycle.name}</p>
                <Badge status={cycle.status} />
              </div>
              <Link
                to="/contributions/group"
                className="text-sm underline"
                style={{ color: '#1a3c6e' }}
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>{paidCount}</p>
                <p className="text-xs text-gray-500">Members Paid</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{totalMembers - paidCount}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
