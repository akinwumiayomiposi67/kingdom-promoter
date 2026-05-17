import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, FileText, ExternalLink } from "lucide-react";
import { getDisbursements, getReceiptUrl } from "../../api/disbursements";
import formatCurrency from "../../utils/formatCurrency";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";

function DisbursementCard({ disbursement }) {
  const handleViewReceipt = async () => {
    try {
      const res = await getReceiptUrl(disbursement.id);
      window.open(res.data.data.url, "_blank", "noopener,noreferrer");
    } catch {
      alert("Could not retrieve receipt. Please try again.");
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">
              {disbursement.title}
            </h3>
            <span
              className={`badge ${disbursement.is_published ? "badge-published" : "badge-draft"}`}
            >
              {disbursement.is_published ? "Published" : "Draft"}
            </span>
          </div>
          <p className="text-xs text-slate-400">{disbursement.cycle?.name}</p>
          {disbursement.description && (
            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
              {disbursement.description}
            </p>
          )}
        </div>
        <p className="text-2xl font-bold text-emerald-600 whitespace-nowrap">
          {formatCurrency(disbursement.amount)}
        </p>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
        <p className="text-xs text-slate-400">
          {disbursement.published_at
            ? new Date(disbursement.published_at).toLocaleDateString("en-NG", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </p>
        <button
          onClick={handleViewReceipt}
          className="btn-outline btn-sm gap-1"
        >
          <ExternalLink size={13} /> View Receipt
        </button>
      </div>
    </div>
  );
}

export default function Disbursements() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["member-disbursements"],
    queryFn: () => getDisbursements().then((r) => r.data.data.disbursements),
  });

  const disbursements = data?.data ?? [];

  return (
    <div className="page-content">
      <PageHeader
        title="Disbursements"
        description="Published cycle disbursements"
      />

      {isError && (
        <p className="text-red-500 text-sm">Failed to load disbursements.</p>
      )}

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : disbursements.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ArrowUpRight}
            title="No disbursements yet"
            description="Published disbursements will appear here."
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {disbursements.map((d) => (
            <DisbursementCard key={d.id} disbursement={d} />
          ))}
        </div>
      )}
    </div>
  );
}
