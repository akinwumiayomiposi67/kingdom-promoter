import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet2, CheckCircle } from "lucide-react";
import { getAdminWallets, manualDebit } from "../../api/admin";
import formatCurrency from "../../utils/formatCurrency";
import PageHeader from "../../components/ui/PageHeader";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";

export default function AdminWallets() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [debitModal, setDebitModal] = useState(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [debitError, setDebitError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-wallets", page],
    queryFn: () => getAdminWallets({ page }).then((r) => r.data.data.members),
    keepPreviousData: true,
  });

  const debitMutation = useMutation({
    mutationFn: ({ userId, amount, reason }) =>
      manualDebit(userId, { amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wallets"] });
      setDebitModal(null);
      setAmount("");
      setReason("");
      setDebitError("");
      setSuccessMsg("Debit applied successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    },
    onError: (err) => {
      setDebitError(
        err?.response?.data?.message ??
          err?.response?.data?.errors?.amount?.[0] ??
          "Failed to apply debit.",
      );
    },
  });

  const members = data?.data ?? [];
  const meta = data ?? {};
  const lastPage = meta?.last_page ?? 1;

  return (
    <div className="page-content">
      <PageHeader
        title="Member Wallets"
        description="View balances and perform manual debits"
      />

      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 text-sm text-emerald-800">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : members.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Wallet2}
            title="No wallets found"
            description="No members with wallets yet."
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th className="text-right">Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium text-slate-900">{m.name}</td>
                    <td className="text-slate-500 text-sm">{m.email}</td>
                    <td className="text-right font-semibold text-brand-700">
                      {formatCurrency(m.wallet?.balance ?? 0)}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setDebitModal({ member: m });
                          setAmount("");
                          setReason("");
                          setDebitError("");
                        }}
                        className="btn-danger btn-sm"
                      >
                        Manual Debit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-outline btn-sm"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page} of {lastPage}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page === lastPage}
            className="btn-outline btn-sm"
          >
            Next
          </button>
        </div>
      )}

      <Modal
        open={!!debitModal}
        onClose={() => setDebitModal(null)}
        title={`Manual Debit — ${debitModal?.member?.name}`}
      >
        <div className="space-y-4">
          {debitError && <p className="error-text">{debitError}</p>}
          <div>
            <label className="form-label">Amount (₦)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Reason</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDebitModal(null)} className="btn-outline">
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
              className="btn-danger"
            >
              {debitMutation.isPending ? "Processing…" : "Confirm Debit"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
