import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMembers, updateMemberStatus, inviteMember } from '../../api/admin';
import Badge from '../../components/ui/Badge';
import formatCurrency from '../../utils/formatCurrency';

const STATUS_COLORS = {
  active: 'green',
  inactive: 'gray',
  suspended: 'red',
};

export default function Members() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Status change modal
  const [statusModal, setStatusModal] = useState(null); // { member, newStatus }
  const [statusReason, setStatusReason] = useState('');

  // Invite modal
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-members', search, statusFilter, page],
    queryFn: () =>
      getMembers({ search: search || undefined, status: statusFilter || undefined, page }).then(
        (r) => r.data.data.members
      ),
    keepPreviousData: true,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }) => updateMemberStatus(id, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      setStatusModal(null);
      setStatusReason('');
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (email) => inviteMember({ email }),
    onSuccess: () => {
      setInviteModal(false);
      setInviteEmail('');
      setInviteError('');
    },
    onError: (err) => {
      const msg = err?.response?.data?.errors?.email?.[0] ?? err?.response?.data?.message ?? 'Failed to send invitation.';
      setInviteError(msg);
    },
  });

  const members = data?.data ?? [];
  const meta = data ?? {};

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold" style={{ color: '#1a3c6e' }}>Members</h1>
          <button
            onClick={() => setInviteModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#f59e0b' }}
          >
            + Invite New Member
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Search name, email or phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-72 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#1a3c6e' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {isLoading ? (
            <p className="p-6 text-gray-500 text-sm">Loading members…</p>
          ) : error ? (
            <p className="p-6 text-red-500 text-sm">Failed to load members.</p>
          ) : members.length === 0 ? (
            <p className="p-6 text-gray-500 text-sm">No members found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Phone</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Wallet Balance</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium">{member.name}</td>
                    <td className="px-5 py-3 text-gray-600">{member.email}</td>
                    <td className="px-5 py-3 text-gray-600">{member.phone}</td>
                    <td className="px-5 py-3">
                      <Badge color={STATUS_COLORS[member.status] ?? 'gray'}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-mono">
                      {member.wallet ? formatCurrency(member.wallet.balance) : '—'}
                    </td>
                    <td className="px-5 py-3 flex gap-2">
                      <Link
                        to={`/admin/members/${member.id}`}
                        className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => setStatusModal({ member, newStatus: member.status === 'active' ? 'suspended' : 'active' })}
                        className="text-xs px-3 py-1 rounded border hover:bg-gray-100"
                        style={{ borderColor: '#1a3c6e', color: '#1a3c6e' }}
                      >
                        Change Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex justify-end gap-2 mt-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <button
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Status change modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-1" style={{ color: '#1a3c6e' }}>Change Member Status</h2>
            <p className="text-sm text-gray-600 mb-4">
              Change <strong>{statusModal.member.name}</strong> to:
            </p>
            <select
              value={statusModal.newStatus}
              onChange={(e) => setStatusModal((m) => ({ ...m, newStatus: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            <textarea
              placeholder="Reason (optional)…"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 h-20 resize-none"
            />
            {statusMutation.isError && (
              <p className="text-red-500 text-xs mb-3">
                {statusMutation.error?.response?.data?.message ?? 'Failed to update status.'}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setStatusModal(null); setStatusReason(''); }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => statusMutation.mutate({ id: statusModal.member.id, status: statusModal.newStatus, reason: statusReason })}
                disabled={statusMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg text-white font-semibold"
                style={{ background: '#1a3c6e' }}
              >
                {statusMutation.isPending ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#1a3c6e' }}>Invite New Member</h2>
            <input
              type="email"
              placeholder="Email address…"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
            />
            {inviteError && <p className="text-red-500 text-xs mb-3">{inviteError}</p>}
            {inviteMutation.isSuccess && (
              <p className="text-green-600 text-xs mb-3">Invitation sent successfully!</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setInviteModal(false); setInviteEmail(''); setInviteError(''); }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => inviteMutation.mutate(inviteEmail)}
                disabled={inviteMutation.isPending || !inviteEmail}
                className="px-4 py-2 text-sm rounded-lg text-white font-semibold"
                style={{ background: '#f59e0b' }}
              >
                {inviteMutation.isPending ? 'Sending…' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
