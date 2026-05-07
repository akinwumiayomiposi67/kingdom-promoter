import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getWallet } from '../../api/wallet';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/formatCurrency';

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet().then((r) => r.data.data.wallet),
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a3c6e' }}>
          Member Dashboard
        </h1>
        <p className="text-gray-600 mb-6">Welcome back, {user?.name}!</p>

        {/* Wallet summary card */}
        <div
          className="rounded-xl p-6 text-white shadow-md mb-6"
          style={{ backgroundColor: '#1a3c6e' }}
        >
          <p className="text-sm uppercase tracking-wide opacity-80">Wallet Balance</p>
          {isLoading ? (
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
      </div>
    </div>
  );
}
