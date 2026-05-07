import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getGroupContributions } from '../../api/contributions';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/ui/Badge';

export default function GroupContributions() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['group-contributions', page],
    queryFn: () => getGroupContributions(page).then((r) => r.data.data),
    keepPreviousData: true,
  });

  const cycle = data?.cycle;
  const contributions = data?.contributions?.data ?? [];
  const meta = data?.contributions;

  const totalPaid = contributions.filter((c) => c.status === 'paid').length;
  const totalPending = contributions.filter((c) => c.status === 'pending').length;
  const totalAmount = contributions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#1a3c6e' }}>
            Group Contributions
          </h1>
          <Link
            to="/contributions"
            className="text-sm underline"
            style={{ color: '#1a3c6e' }}
          >
            ← My contributions
          </Link>
        </div>

        {isLoading && <p className="text-gray-500">Loading…</p>}
        {isError && <p className="text-red-500">Failed to load group data.</p>}

        {!isLoading && !cycle && (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <p className="text-gray-500">No active contribution cycle at the moment.</p>
          </div>
        )}

        {cycle && (
          <>
            {/* Cycle info */}
            <div className="rounded-xl p-5 text-white mb-5 shadow-md" style={{ backgroundColor: '#1a3c6e' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase opacity-70 tracking-wide">Active Cycle</p>
                  <p className="text-xl font-bold mt-0.5">{cycle.name}</p>
                </div>
                <Badge status={cycle.status} />
              </div>
              <p className="text-xs opacity-70 mt-2">
                {new Date(cycle.start_date).toLocaleDateString()} — {new Date(cycle.end_date).toLocaleDateString()}
                &nbsp;·&nbsp; Debit day: {cycle.debit_day}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { label: 'Paid', value: totalPaid, color: '#16a34a' },
                { label: 'Pending', value: totalPending, color: '#f59e0b' },
                { label: 'Total Collected', value: formatCurrency(totalAmount), color: '#1a3c6e' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b bg-gray-50">
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {contributions.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{c.member_name}</td>
                      <td className="px-4 py-3 text-gray-600">{c.package?.name ?? '—'}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: '#1a3c6e' }}>
                        {formatCurrency(c.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge status={c.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
                  <span>Page {meta.current_page} of {meta.last_page}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={meta.current_page === 1}
                      className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={meta.current_page === meta.last_page}
                      className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
