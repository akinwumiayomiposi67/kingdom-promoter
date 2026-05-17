import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Package,
  ToggleLeft,
  ToggleRight,
  Edit3,
  CheckCircle,
} from "lucide-react";
import {
  getPackages,
  createPackage,
  updatePackage,
  togglePackage,
} from "../../api/admin";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import { SkeletonTable } from "../../components/ui/Skeleton";
import formatCurrency from "../../utils/formatCurrency";

const EMPTY_FORM = { name: "", description: "", amount: "", max_members: "" };

export default function ContributionPackages() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null); // package object or null
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: () => getPackages().then((r) => r.data.data),
  });

  const savePackage = useMutation({
    mutationFn: (f) =>
      editing ? updatePackage(editing.id, f) : createPackage(f),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-packages"] });
      closeModal();
    },
    onError: (err) =>
      setError(err?.response?.data?.message ?? "Failed to save"),
  });

  const togglePkg = useMutation({
    mutationFn: (id) => togglePackage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-packages"] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setModal(true);
  };
  const openEdit = (pkg) => {
    setEditing(pkg);
    setForm({
      name: pkg.name,
      description: pkg.description ?? "",
      amount: pkg.amount,
      max_members: pkg.max_members ?? "",
    });
    setError("");
    setModal(true);
  };
  const closeModal = () => {
    setModal(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
  };

  const packages = data ?? [];

  return (
    <div className="page-content">
      <PageHeader
        title="Contribution Packages"
        description="Manage monthly contribution tiers"
        action={
          <button onClick={openCreate} className="btn-primary btn-sm gap-1">
            <Plus size={14} /> New Package
          </button>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : packages.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Package}
            title="No packages"
            description="Create your first contribution package."
            action={
              <button onClick={openCreate} className="btn-primary btn-sm">
                Create Package
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
                  <th>Package Name</th>
                  <th className="text-right">Monthly Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-slate-900">{p.name}</td>
                    <td className="text-right font-semibold text-brand-700">
                      {formatCurrency(p.amount ?? p.monthly_amount)}
                    </td>
                    <td>
                      <span
                        className={`badge ${p.is_active ? "badge-active" : "badge"}`}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="btn-outline btn-sm gap-1"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => togglePkg.mutate(p.id)}
                          disabled={togglePkg.isPending}
                          className={
                            p.is_active
                              ? "btn-danger btn-sm"
                              : "btn-success btn-sm"
                          }
                        >
                          {p.is_active ? (
                            <>
                              <ToggleLeft size={13} /> Deactivate
                            </>
                          ) : (
                            <>
                              <ToggleRight size={13} /> Activate
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modal}
        onClose={closeModal}
        title={editing ? "Edit Package" : "New Package"}
      >
        <div className="space-y-4">
          {error && <p className="error-text">{error}</p>}
          <div>
            <label className="form-label">Package Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Monthly Amount (₦)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Description (optional)</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="input-field resize-none"
            />
          </div>
          <div>
            <label className="form-label">Max Members (optional)</label>
            <input
              type="number"
              min="1"
              value={form.max_members}
              onChange={(e) =>
                setForm({ ...form, max_members: e.target.value })
              }
              className="input-field"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={closeModal} className="btn-outline">
              Cancel
            </button>
            <button
              onClick={() => savePackage.mutate(form)}
              disabled={savePackage.isPending || !form.name || !form.amount}
              className="btn-primary"
            >
              {savePackage.isPending
                ? "Saving…"
                : editing
                  ? "Save Changes"
                  : "Create Package"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
