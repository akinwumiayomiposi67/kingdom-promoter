import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyContributions } from '../../api/contributions';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/ui/Badge';

export default function MyContributions() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-contributions', page],
    queryFn: () => getMyContributions(page).then((r) => r.data.data),
    keepPreviousData: true,
  });

  const contributions = data?.data ?? [];
  const meta = data;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#1a3c6e' }}>
            My Contributions
          </h1>
          <Link
            to="/contributions/group"
            className="text-sm underline"
            style={{ color: '#1a3c6e' }}
          >
            View group contributions →
          </Link>
        </div>

        {isLoading && <p className="text-gray-500">Loading…</p>}
        {isError && <p className="text-red-500">Failed to load contributions.</p>}

        {!isLoading && contributions.length === 0 && (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <p className="text-gray-500">You have no contributions yet.</p>
            <Link
              to="/onboarding"
              className="inline-block mt-4 text-sm font-semibold underline"
              style={{ color: '#1a3c6e' }}
            >
              Choose a package to get started →
            </Link>
          </div>
        )}

        {contributions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b bg-gray-50">
                  <th className="px-4 py-3">Cycle</th>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contributions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{c.cycle?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.package?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#1a3c6e' }}>
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.paid_at
                        ? new Date(c.paid_at).toLocaleDateString()
                        : new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-gray-600">
                <span>
                  Page {meta.current_page} of {meta.last_page}
                </span>
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
        )}
      </div>
    </div>
  );
}
