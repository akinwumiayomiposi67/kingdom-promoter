import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getWallet } from '../../api/wallet';
import { formatCurrency } from '../../utils/formatCurrency';

export default function Wallet() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getWallet().then((r) => r.data.data.wallet),
  });

  function copyAccountNumber() {
    if (data?.virtual_account_number) {
      navigator.clipboard.writeText(data.virtual_account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading wallet…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Failed to load wallet. Please try again.</p>
      </div>
    );
  }

  const transactions = data?.transactions?.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1a3c6e' }}>
          My Wallet
        </h1>

        {/* Balance card */}
        <div
          className="rounded-xl p-6 text-white shadow-md"
          style={{ backgroundColor: '#1a3c6e' }}
        >
          <p className="text-sm uppercase tracking-wide opacity-80">Available Balance</p>
          <p className="text-4xl font-bold mt-1">{formatCurrency(data?.balance ?? 0)}</p>
        </div>

        {/* Virtual account card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Dedicated Virtual Account
          </h2>
          {data?.virtual_account_number ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Bank</span>
                <span className="font-medium">{data.virtual_account_bank ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Account Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{data.virtual_account_number}</span>
                  <button
                    onClick={copyAccountNumber}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              Virtual account not yet assigned. Please contact support.
            </p>
          )}
        </div>

        {/* Transactions table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">Transaction History</h2>
          </div>
          {transactions.length === 0 ? (
            <p className="px-6 py-8 text-center text-gray-400">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Description</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3 text-left">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleDateString('en-NG', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            tx.type === 'credit'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-700">{tx.description || '—'}</td>
                      <td
                        className={`px-6 py-3 text-right font-medium ${
                          tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.type === 'credit' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-3 text-gray-400 font-mono text-xs truncate max-w-[120px]">
                        {tx.reference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
