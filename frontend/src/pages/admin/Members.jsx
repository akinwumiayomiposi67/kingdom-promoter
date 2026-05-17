import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Users, Plus } from "lucide-react";
import { getMembers, updateMemberStatus, inviteMember } from "../../api/admin";
import formatCurrency from "../../utils/formatCurrency";
import PageHeader from "../../components/ui/PageHeader";
import { SkeletonTable } from "../../components/ui/Skeleton";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";

export default function Members() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [statusModal, setStatusModal] = useState(null);
  const [statusReason, setStatusReason] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-members", search, statusFilter, page],
    queryFn: () =>
      getMembers({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
      }).then((r) => r.data.data.members),
    keepPreviousData: true,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }) =>
      updateMemberStatus(id, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      setStatusModal(null);
      setStatusReason("");
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (email) => inviteMember({ email }),
    onSuccess: () => {
      setInviteOpen(false);
      setInviteEmail("");
      setInviteError("");
    },
    onError: (err) => {
      setInviteError(
        err?.response?.data?.errors?.email?.[0] ??
          err?.response?.data?.message ??
          "Failed to send invitation.",
      );
    },
  });

  const members = data?.data ?? [];
  const meta = data ?? {};

  const statusClass = (s) =>
    ({
      active: "badge-active",
      suspended: "badge-suspended",
      inactive: "badge",
    })[s] ?? "badge";

  const lastPage = data?.last_page ?? 1;

  return (
    <div className="page-content">
      <PageHeader
        title="Members"
        description="Manage member accounts"
        action={
          <button
            onClick={() => setInviteOpen(true)}
            className="btn-gold btn-sm gap-1"
          >
            <Plus size={14} /> Invite Member
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input-field w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="input-field w-36"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : members.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No members found"
            description="No members match your filters."
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Package</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium text-slate-900">{m.name}</td>
                    <td className="text-slate-500 text-sm">{m.email}</td>
                    <td>
                      <span className={`badge ${statusClass(m.status)}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="text-slate-500 text-sm">
                      {m.active_package?.name ?? "—"}
                    </td>
                    <td>
                      <select
                        value={m.status}
                        onChange={(e) => {
                          setStatusModal({
                            member: m,
                            newStatus: e.target.value,
                          });
                          setStatusReason("");
                        }}
                        className="input-field py-1 text-xs"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                      </select>
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
        open={!!statusModal}
        onClose={() => setStatusModal(null)}
        title="Change Member Status"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Change <strong>{statusModal?.member?.name}</strong> status to{" "}
            <strong>{statusModal?.newStatus}</strong>.
          </p>
          <div>
            <label className="form-label">Reason (optional)</label>
            <textarea
              rows={3}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setStatusModal(null)}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                statusMutation.mutate({
                  id: statusModal.member.id,
                  status: statusModal.newStatus,
                  reason: statusReason,
                })
              }
              disabled={statusMutation.isPending}
              className="btn-primary"
            >
              {statusMutation.isPending ? "Updating…" : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteEmail("");
          setInviteError("");
        }}
        title="Invite New Member"
      >
        <div className="space-y-4">
          {inviteError && <p className="error-text">{inviteError}</p>}
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                setInviteError("");
              }}
              className="input-field"
              placeholder="member@example.com"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setInviteOpen(false);
                setInviteEmail("");
                setInviteError("");
              }}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={() => inviteMutation.mutate(inviteEmail)}
              disabled={inviteMutation.isPending || !inviteEmail}
              className="btn-gold"
            >
              {inviteMutation.isPending ? "Sending…" : "Send Invitation"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
