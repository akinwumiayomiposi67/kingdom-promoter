import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users, CalendarRange, ArrowLeft } from "lucide-react";
import { getGroupContributions } from "../../api/contributions";
import formatCurrency from "../../utils/formatCurrency";
import PageHeader from "../../components/ui/PageHeader";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";

export default function GroupContributions() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["group-contributions", page],
    queryFn: () => getGroupContributions(page).then((r) => r.data.data),
    keepPreviousData: true,
  });

  const cycle = data?.cycle;
  const contributions = data?.contributions?.data ?? [];
  const meta = data?.contributions;

  const totalPaid = contributions.filter((c) => c.status === "paid").length;
  const totalPending = contributions.filter(
    (c) => c.status === "pending",
  ).length;
  const totalAmount = contributions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);

  const statusClass = (s) =>
    ({
      paid: "badge-paid",
      pending: "badge-pending",
      failed: "badge-failed",
    })[s] ?? "badge";

  return (
    <div className="page-content">
      <PageHeader
        title="Group Contributions"
        description={
          cycle ? `Cycle: ${cycle.name}` : "All members — current cycle"
        }
        action={
          <Link to="/contributions" className="btn-outline btn-sm gap-1">
            <ArrowLeft size={14} /> Mine
          </Link>
        }
      />

      {!isLoading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Total Paid
            </p>
            <p className="font-bold text-emerald-600 text-lg">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Pending
            </p>
            <p className="font-bold text-amber-500 text-lg">
              {formatCurrency(totalPending)}
            </p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              Total
            </p>
            <p className="font-bold text-brand-700 text-lg">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>
      )}

      {isError && (
        <p className="text-red-500 text-sm">Failed to load contributions.</p>
      )}

      {isLoading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : contributions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No contributions"
            description="No contributions found for this cycle."
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th>Member</th>
                  <th className="text-right">Amount</th>
                  <th>Package</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium text-slate-900">
                      {c.user?.name ?? "—"}
                    </td>
                    <td className="text-right font-semibold text-brand-700">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="text-slate-500 text-sm">
                      {c.package?.name ?? "—"}
                    </td>
                    <td>
                      <span className={`badge ${statusClass(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meta?.last_page > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-outline btn-sm"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {meta.last_page}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
            disabled={page >= meta.last_page}
            className="btn-outline btn-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
