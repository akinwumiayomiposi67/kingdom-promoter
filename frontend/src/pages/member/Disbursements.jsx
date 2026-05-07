import { useQuery } from '@tanstack/react-query';
import { getDisbursements, getReceiptUrl } from '../../api/disbursements';
import { formatCurrency } from '../../utils/formatCurrency';

function DisbursementCard({ disbursement }) {
  const handleViewReceipt = async () => {
    try {
      const res = await getReceiptUrl(disbursement.id);
      window.open(res.data.data.url, '_blank', 'noopener,noreferrer');
    } catch {
      alert('Could not retrieve receipt. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{disbursement.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{disbursement.cycle?.name}</p>
        </div>
        <p className="text-xl font-bold whitespace-nowrap" style={{ color: '#16a34a' }}>
          {formatCurrency(disbursement.amount)}
        </p>
      </div>

      {disbursement.description && (
        <p className="text-sm text-gray-600 mt-3 line-clamp-2">{disbursement.description}</p>
      )}

      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-400">
          {disbursement.published_at
            ? new Date(disbursement.published_at).toLocaleDateString('en-NG', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </p>
        <button
          onClick={handleViewReceipt}
          className="text-sm font-medium underline"
          style={{ color: '#1a3c6e' }}
        >
          View Receipt →
        </button>
      </div>
    </div>
  );
}

export default function Disbursements() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['member-disbursements'],
    queryFn: () => getDisbursements().then((r) => r.data.data.disbursements),
  });

  const disbursements = data?.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#1a3c6e' }}>
          Disbursements
        </h1>
        <p className="text-gray-500 text-sm mb-6">Published cycle disbursements</p>

        {isLoading && (
          <p className="text-gray-400 text-sm">Loading disbursements…</p>
        )}

        {isError && (
          <p className="text-red-500 text-sm">Failed to load disbursements.</p>
        )}

        {!isLoading && !isError && disbursements.length === 0 && (
          <p className="text-gray-400 text-sm">No disbursements have been published yet.</p>
        )}

        <div className="grid gap-4">
          {disbursements.map((d) => (
            <DisbursementCard key={d.id} disbursement={d} />
          ))}
        </div>
      </div>
    </div>
  );
}
