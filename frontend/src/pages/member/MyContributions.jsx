import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ListChecks, Users } from "lucide-react";
import { getMyContributions } from "../../api/contributions";
import formatCurrency from "../../utils/formatCurrency";
import PageHeader from "../../components/ui/PageHeader";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";

export default function MyContributions() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-contributions", page],
    queryFn: () => getMyContributions(page).then((r) => r.data.data),
    keepPreviousData: true,
  });

  const contributions = data?.data ?? [];
  const meta = data;

  const statusClass = (s) =>
    ({
      paid: "badge-paid",
      pending: "badge-pending",
      failed: "badge-failed",
    })[s] ?? "badge";

  return (
    <div className="page-content">
      <PageHeader
        title="My Contributions"
        description="Your monthly contribution history"
        action={
          <Link to="/group-contributions" className="btn-outline btn-sm gap-1">
            <Users size={14} /> Group View
          </Link>
        }
      />

      {isError && (
        <p className="text-red-500 text-sm">Failed to load contributions.</p>
      )}

      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : contributions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ListChecks}
            title="No contributions"
            description="Your contributions will appear here once a cycle starts."
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>Package</th>
                  <th className="text-right">Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium text-slate-900">
                      {c.cycle?.name ?? "—"}
                    </td>
                    <td className="text-slate-500 text-sm">
                      {c.package?.name ?? "—"}
                    </td>
                    <td className="text-right font-semibold text-brand-700">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="text-slate-400 text-sm">
                      {c.created_at
                        ? format(new Date(c.created_at), "MMM d, yyyy")
                        : "—"}
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
            Page {page} of {meta?.last_page}
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
