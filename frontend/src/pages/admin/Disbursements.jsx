import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ArrowUpRight } from "lucide-react";
import {
  getAdminDisbursements,
  createDisbursement,
  publishDisbursement,
} from "../../api/disbursements";
import formatCurrency from "../../utils/formatCurrency";
import PageHeader from "../../components/ui/PageHeader";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import api from "../../api/axios";

function CreateDisbursementForm({ cycles, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    amount: "",
    description: "",
    contribution_cycle_id: "",
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (fd) => createDisbursement(fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disbursements"] });
      onCreated();
    },
    onError: (err) =>
      setError(err.response?.data?.message || "Failed to create disbursement."),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("amount", form.amount);
    fd.append("description", form.description);
    fd.append("contribution_cycle_id", form.contribution_cycle_id);
    if (file) fd.append("receipt", file);
    mutation.mutate(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="error-text">{error}</p>}
      <div>
        <label className="form-label">Title</label>
        <input
          type="text"
          required
          maxLength={200}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="input-field"
        />
      </div>
      <div>
        <label className="form-label">Amount (₦)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          required
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="input-field"
        />
      </div>
      <div>
        <label className="form-label">Cycle</label>
        <select
          required
          value={form.contribution_cycle_id}
          onChange={(e) =>
            setForm({ ...form, contribution_cycle_id: e.target.value })
          }
          className="input-field"
        >
          <option value="">Select a cycle…</option>
          {(cycles ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="form-label">Description</label>
        <textarea
          rows={3}
          maxLength={2000}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-field resize-none"
        />
      </div>
      <div>
        <label className="form-label">Receipt (PDF/JPG/PNG, max 5 MB)</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => setFile(e.target.files[0] ?? null)}
          className="text-sm text-slate-500"
        />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="btn-outline">
          Cancel
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary"
        >
          {mutation.isPending ? "Saving…" : "Create"}
        </button>
      </div>
    </form>
  );
}

export default function AdminDisbursements() {
  const [tab, setTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-disbursements"],
    queryFn: () =>
      getAdminDisbursements().then((r) => r.data.data.disbursements),
  });

  const { data: cyclesData } = useQuery({
    queryKey: ["admin-cycles-for-disbursement"],
    queryFn: () =>
      api
        .get("/admin/cycles")
        .then((r) => r.data.data.cycles?.data ?? r.data.data.cycles ?? []),
  });

  const publishMutation = useMutation({
    mutationFn: (id) => publishDisbursement(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-disbursements"] }),
  });

  const allDisbursements = data?.data ?? [];
  const displayed =
    tab === "published"
      ? allDisbursements.filter((d) => d.is_published)
      : allDisbursements;

  return (
    <div className="page-content">
      <PageHeader
        title="Disbursements"
        description="Manage cycle disbursements"
        action={
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary btn-sm gap-1"
          >
            <Plus size={14} /> Create Disbursement
          </button>
        }
      />

      <div className="flex gap-2">
        {["all", "published"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isError && (
        <p className="text-red-500 text-sm">Failed to load disbursements.</p>
      )}

      {isLoading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : displayed.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ArrowUpRight}
            title="No disbursements"
            description="Create a disbursement to get started."
            action={
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary btn-sm"
              >
                Create
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
                  <th>Title</th>
                  <th>Cycle</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((d) => (
                  <tr key={d.id}>
                    <td className="font-medium text-slate-900">{d.title}</td>
                    <td className="text-slate-500">{d.cycle?.name ?? "—"}</td>
                    <td className="text-right font-semibold text-brand-700">
                      {formatCurrency(d.amount)}
                    </td>
                    <td>
                      <span
                        className={`badge ${d.is_published ? "badge-published" : "badge-draft"}`}
                      >
                        {d.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td>
                      {!d.is_published ? (
                        <button
                          onClick={() => publishMutation.mutate(d.id)}
                          disabled={publishMutation.isPending}
                          className="btn-success btn-sm"
                        >
                          Publish
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">
                          {d.published_at
                            ? new Date(d.published_at).toLocaleDateString(
                                "en-NG",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "Published"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create Disbursement"
      >
        <CreateDisbursementForm
          cycles={cyclesData ?? []}
          onClose={() => setShowModal(false)}
          onCreated={() => setShowModal(false)}
        />
      </Modal>
    </div>
  );
}
