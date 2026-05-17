import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCcw, CheckCircle, Zap, ChevronDown } from "lucide-react";
import {
  getCycles,
  createCycle,
  closeCycle,
  triggerDebit,
} from "../../api/admin";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import { SkeletonTable } from "../../components/ui/Skeleton";
import formatCurrency from "../../utils/formatCurrency";
import { format } from "date-fns";

const STATUS_BADGE = { open: "badge-active", closed: "badge-suspended" };

export default function MonthlyContributions() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    month: "",
    year: new Date().getFullYear(),
    notes: "",
  });
  const [error, setError] = useState("");
  const [confirmClose, setConfirmClose] = useState(null);
  const [confirmDebit, setConfirmDebit] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-cycles"],
    queryFn: () => getCycles().then((r) => r.data.data),
  });

  const createMut = useMutation({
    mutationFn: (f) => createCycle(f),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cycles"] });
      setModal(false);
      setForm({ month: "", year: new Date().getFullYear(), notes: "" });
      setError("");
    },
    onError: (err) =>
      setError(err?.response?.data?.message ?? "Failed to create cycle"),
  });

  const closeMut = useMutation({
    mutationFn: (id) => closeCycle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cycles"] });
      setConfirmClose(null);
    },
  });

  const debitMut = useMutation({
    mutationFn: (id) => triggerDebit(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-cycles"] });
      setConfirmDebit(null);
    },
    onError: (err) =>
      alert(err?.response?.data?.message ?? "Failed to trigger debit"),
  });

  const cycles = data ?? [];

  return (
    <div className="page-content">
      <PageHeader
        title="Contribution Cycles"
        description="Manage monthly contribution cycles"
        action={
          <button
            onClick={() => setModal(true)}
            className="btn-primary btn-sm gap-1"
          >
            <Plus size={14} /> New Cycle
          </button>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : cycles.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={RefreshCcw}
            title="No cycles"
            description="Create a cycle to get started."
            action={
              <button
                onClick={() => setModal(true)}
                className="btn-primary btn-sm"
              >
                Create Cycle
              </button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Month / Year</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium text-slate-900">
                      {c.name ?? `${c.month} ${c.year}`}
                    </td>
                    <td className="text-slate-500 text-sm">
                      {c.month} / {c.year}
                    </td>
                    <td>
                      <span
                        className={`badge ${STATUS_BADGE[c.status] ?? "badge"}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="text-slate-400 text-sm">{c.notes ?? "—"}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {c.status === "open" && (
                          <>
                            <button
                              onClick={() => setConfirmDebit(c)}
                              className="btn-outline btn-sm gap-1"
                              title="Trigger debit"
                            >
                              <Zap size={13} /> Debit
                            </button>
                            <button
                              onClick={() => setConfirmClose(c)}
                              className="btn-danger btn-sm"
                            >
                              Close
                            </button>
                          </>
                        )}
                        {c.status === "closed" && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <CheckCircle size={12} /> Closed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create cycle modal */}
      <Modal
        open={modal}
        onClose={() => {
          setModal(false);
          setForm({ month: "", year: new Date().getFullYear(), notes: "" });
          setError("");
        }}
        title="New Contribution Cycle"
      >
        <div className="space-y-4">
          {error && <p className="error-text">{error}</p>}
          <div>
            <label className="form-label">Month</label>
            <select
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              className="input-field"
            >
              <option value="">Select month…</option>
              {[
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Year</label>
            <input
              type="number"
              min={2020}
              max={2100}
              value={form.year}
              onChange={(e) => setForm({ ...form, year: +e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Notes (optional)</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setModal(false);
                setError("");
              }}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={() => createMut.mutate(form)}
              disabled={createMut.isPending || !form.month}
              className="btn-primary"
            >
              {createMut.isPending ? "Creating…" : "Create Cycle"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Close cycle confirm */}
      <Modal
        open={!!confirmClose}
        onClose={() => setConfirmClose(null)}
        title="Close Cycle"
      >
        <p className="text-sm text-slate-600 mb-4">
          Close cycle <strong>{confirmClose?.name}</strong>? No further
          contributions will be accepted.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setConfirmClose(null)} className="btn-outline">
            Cancel
          </button>
          <button
            onClick={() => closeMut.mutate(confirmClose.id)}
            disabled={closeMut.isPending}
            className="btn-danger"
          >
            {closeMut.isPending ? "Closing…" : "Close Cycle"}
          </button>
        </div>
      </Modal>

      {/* Trigger debit confirm */}
      <Modal
        open={!!confirmDebit}
        onClose={() => setConfirmDebit(null)}
        title="Trigger Debit"
      >
        <p className="text-sm text-slate-600 mb-4">
          Trigger debit for all members in <strong>{confirmDebit?.name}</strong>
          ?
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setConfirmDebit(null)} className="btn-outline">
            Cancel
          </button>
          <button
            onClick={() => debitMut.mutate(confirmDebit.id)}
            disabled={debitMut.isPending}
            className="btn-primary gap-1"
          >
            <Zap size={14} />{" "}
            {debitMut.isPending ? "Processing…" : "Trigger Debit"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
