import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getContributionsReport, getWalletsReport } from '../../api/admin';
import api from '../../api/axios';

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function Reports() {
  // Contributions report state
  const [cycleId, setCycleId] = useState('');
  const [contribFormat, setContribFormat] = useState('csv');
  const [contribLoading, setContribLoading] = useState(false);
  const [contribError, setContribError] = useState('');

  // Wallets report state
  const [walletFormat, setWalletFormat] = useState('csv');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');

  const { data: cyclesData } = useQuery({
    queryKey: ['admin-cycles-report'],
    queryFn: () => api.get('/admin/cycles').then((r) => r.data.data.cycles?.data ?? []),
  });

  const cycles = cyclesData ?? [];

  async function handleDownloadContributions() {
    setContribLoading(true);
    setContribError('');
    try {
      const params = { format: contribFormat };
      if (cycleId) params.cycle_id = cycleId;
      const response = await getContributionsReport(params);
      const ext = contribFormat;
      downloadBlob(response.data, `contributions-report-${Date.now()}.${ext}`);
    } catch {
      setContribError('Failed to download report. Please try again.');
    } finally {
      setContribLoading(false);
    }
  }

  async function handleDownloadWallets() {
    setWalletLoading(true);
    setWalletError('');
    try {
      const response = await getWalletsReport({ format: walletFormat });
      const ext = walletFormat;
      downloadBlob(response.data, `wallets-report-${Date.now()}.${ext}`);
    } catch {
      setWalletError('Failed to download report. Please try again.');
    } finally {
      setWalletLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#1a3c6e' }}>Reports</h1>

        {/* Contributions Report */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#1a3c6e' }}>
            Contributions Report
          </h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cycle (optional)</label>
              <select
                value={cycleId}
                onChange={(e) => setCycleId(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Cycles</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Format</label>
              <select
                value={contribFormat}
                onChange={(e) => setContribFormat(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>
          {contribError && <p className="text-red-500 text-xs mb-3">{contribError}</p>}
          <button
            onClick={handleDownloadContributions}
            disabled={contribLoading}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#1a3c6e' }}
          >
            {contribLoading ? 'Generating…' : '⬇ Download Contributions Report'}
          </button>
        </div>

        {/* Wallets Report */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#1a3c6e' }}>
            Wallets Report
          </h2>
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Format</label>
              <select
                value={walletFormat}
                onChange={(e) => setWalletFormat(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
          </div>
          {walletError && <p className="text-red-500 text-xs mb-3">{walletError}</p>}
          <button
            onClick={handleDownloadWallets}
            disabled={walletLoading}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#1a3c6e' }}
          >
            {walletLoading ? 'Generating…' : '⬇ Download Wallets Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
