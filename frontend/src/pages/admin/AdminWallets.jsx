import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminWallets, manualDebit } from '../../api/admin';
import formatCurrency from '../../utils/formatCurrency';

export default function AdminWallets() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [debitModal, setDebitModal] = useState(null); // { member }
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [debitError, setDebitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-wallets', page],
    queryFn: () =>
      getAdminWallets({ page }).then((r) => r.data.data.members),
    keepPreviousData: true,
  });

  const debitMutation = useMutation({
    mutationFn: ({ userId, amount, reason }) => manualDebit(userId, { amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] });
      setDebitModal(null);
      setAmount('');
      setReason('');
      setDebitError('');
      setSuccessMsg('Debit applied successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    },
    onError: (err) => {
      setDebitError(
        err?.response?.data?.message ??
        err?.response?.data?.errors?.amount?.[0] ??
        'Failed to apply debit.'
      );
    },
  });

  const members = data?.data ?? [];
  const meta = data ?? {};

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#1a3c6e' }}>Wallet Management</h1>

        {successMsg && (
          <div className="bg-green-50 border border-green-300 rounded-xl px-5 py-3 mb-5 text-sm text-green-800">
            {successMsg}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {isLoading ? (
            <p className="p-6 text-gray-500 text-sm">Loading wallets…</p>
          ) : error ? (
            <p className="p-6 text-red-500 text-sm">Failed to load wallets.</p>
          ) : members.length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">No members found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Member</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Balance</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Virtual Account</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">{member.name}</td>
                    <td className="px-5 py-3 text-gray-600">{member.email}</td>
                    <td className="px-5 py-3 font-mono font-semibold" style={{ color: '#1a3c6e' }}>
                      {member.wallet ? formatCurrency(member.wallet.balance) : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {member.wallet?.virtual_account_number
                        ? `${member.wallet.virtual_account_number} (${member.wallet.virtual_account_bank})`
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {member.wallet && (
                        <button
                          onClick={() => { setDebitModal({ member }); setDebitError(''); setAmount(''); setReason(''); }}
                          className="text-xs px-3 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Manual Debit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex justify-end gap-2 mt-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <button
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Manual Debit Modal */}
      {debitModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#1a3c6e' }}>Manual Debit</h2>
            <p className="text-sm text-gray-600 mb-4">
              Debit <strong>{debitModal.member.name}</strong>'s wallet.
              Current balance:{' '}
              <strong>{formatCurrency(debitModal.member.wallet?.balance ?? 0)}</strong>
            </p>

            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Amount (₦)</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setDebitError(''); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
              <textarea
                placeholder="Reason for debit…"
                value={reason}
                onChange={(e) => { setReason(e.target.value); setDebitError(''); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 resize-none"
              />
            </div>

            {debitError && <p className="text-red-500 text-xs mb-3">{debitError}</p>}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDebitModal(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  debitMutation.mutate({
                    userId: debitModal.member.id,
                    amount: parseFloat(amount),
                    reason,
                  })
                }
                disabled={debitMutation.isPending || !amount || !reason}
                className="px-4 py-2 text-sm rounded-lg font-semibold text-white bg-red-600 disabled:opacity-50"
              >
                {debitMutation.isPending ? 'Processing…' : 'Confirm Debit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
