import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminDisbursements,
  createDisbursement,
  publishDisbursement,
} from '../../api/disbursements';
import { getPackages } from '../../api/contributions';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/ui/Badge';

function CreateModal({ cycles, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    amount: '',
    description: '',
    contribution_cycle_id: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (fd) => createDisbursement(fd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disbursements'] });
      onCreated();
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to create disbursement.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('amount', form.amount);
    fd.append('description', form.description);
    fd.append('contribution_cycle_id', form.contribution_cycle_id);
    if (file) fd.append('receipt', file);
    mutation.mutate(fd);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1a3c6e' }}>
          Create Disbursement
        </h2>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 mb-4">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              maxLength={200}
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#1a3c6e' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cycle</label>
            <select
              required
              value={form.contribution_cycle_id}
              onChange={(e) => setForm({ ...form, contribution_cycle_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              maxLength={2000}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receipt (PDF/JPG/PNG, max 5 MB)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files[0] ?? null)}
              className="w-full text-sm text-gray-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm rounded-lg text-white font-semibold disabled:opacity-60"
              style={{ backgroundColor: '#1a3c6e' }}
            >
              {mutation.isPending ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDisbursements() {
  const [tab, setTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-disbursements'],
    queryFn: () => getAdminDisbursements().then((r) => r.data.data.disbursements),
  });

  const { data: cyclesData } = useQuery({
    queryKey: ['admin-cycles-for-disbursement'],
    queryFn: () =>
      import('../../api/axios').then(({ default: api }) =>
        api.get('/admin/cycles').then((r) => r.data.data.cycles)
      ),
  });

  const publishMutation = useMutation({
    mutationFn: (id) => publishDisbursement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-disbursements'] }),
  });

  const allDisbursements = data?.data ?? [];
  const displayed =
    tab === 'published'
      ? allDisbursements.filter((d) => d.is_published)
      : allDisbursements;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1a3c6e' }}>
              Disbursements
            </h1>
            <p className="text-gray-500 text-sm">Manage cycle disbursements</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-sm rounded-lg text-white font-semibold"
            style={{ backgroundColor: '#1a3c6e' }}
          >
            + Create Disbursement
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {['all', 'published'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                tab === t ? 'text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              style={tab === t ? { backgroundColor: '#1a3c6e' } : {}}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-gray-400 text-sm">Loading…</p>}
        {isError && <p className="text-red-500 text-sm">Failed to load disbursements.</p>}

        {!isLoading && !isError && displayed.length === 0 && (
          <p className="text-gray-400 text-sm">No disbursements found.</p>
        )}

        {displayed.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left">Cycle</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayed.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{d.title}</td>
                    <td className="px-6 py-4 text-gray-600">{d.cycle?.name ?? '—'}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-800">
                      {formatCurrency(d.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge status={d.is_published ? 'published' : 'draft'} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      {!d.is_published && (
                        <button
                          onClick={() => publishMutation.mutate(d.id)}
                          disabled={publishMutation.isPending}
                          className="text-xs font-medium px-3 py-1 rounded-full text-white disabled:opacity-60"
                          style={{ backgroundColor: '#16a34a' }}
                        >
                          Publish
                        </button>
                      )}
                      {d.is_published && (
                        <span className="text-xs text-gray-400">
                          {d.published_at
                            ? new Date(d.published_at).toLocaleDateString('en-NG', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Published'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CreateModal
          cycles={cyclesData ?? []}
          onClose={() => setShowModal(false)}
          onCreated={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
