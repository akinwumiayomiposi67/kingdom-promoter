import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, BarChart3, Wallet2, Loader2 } from "lucide-react";
import { getContributionsReport, getWalletsReport } from "../../api/admin";
import api from "../../api/axios";
import PageHeader from "../../components/ui/PageHeader";

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function Reports() {
  const [cycleId, setCycleId] = useState("");
  const [contribFormat, setContribFormat] = useState("csv");
  const [contribLoading, setContribLoading] = useState(false);
  const [contribError, setContribError] = useState("");
  const [walletFormat, setWalletFormat] = useState("csv");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");

  const { data: cyclesData } = useQuery({
    queryKey: ["admin-cycles-report"],
    queryFn: () =>
      api
        .get("/admin/cycles")
        .then((r) => r.data.data.cycles?.data ?? r.data.data.cycles ?? []),
  });

  const cycles = cyclesData ?? [];

  async function handleDownloadContributions() {
    setContribLoading(true);
    setContribError("");
    try {
      const params = { format: contribFormat };
      if (cycleId) params.cycle_id = cycleId;
      const response = await getContributionsReport(params);
      downloadBlob(
        response.data,
        `contributions-report-${Date.now()}.${contribFormat}`,
      );
    } catch {
      setContribError("Failed to download report. Please try again.");
    } finally {
      setContribLoading(false);
    }
  }

  async function handleDownloadWallets() {
    setWalletLoading(true);
    setWalletError("");
    try {
      const response = await getWalletsReport({ format: walletFormat });
      downloadBlob(
        response.data,
        `wallets-report-${Date.now()}.${walletFormat}`,
      );
    } catch {
      setWalletError("Failed to download report. Please try again.");
    } finally {
      setWalletLoading(false);
    }
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Reports"
        description="Download contribution and wallet reports"
      />

      {/* Contributions report */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-brand-600" />
          <h2 className="font-semibold text-slate-900">Contributions Report</h2>
        </div>
        <div className="flex flex-wrap gap-4 mb-5">
          <div>
            <label className="form-label">Cycle (optional)</label>
            <select
              value={cycleId}
              onChange={(e) => setCycleId(e.target.value)}
              className="input-field w-48"
            >
              <option value="">All Cycles</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Format</label>
            <select
              value={contribFormat}
              onChange={(e) => setContribFormat(e.target.value)}
              className="input-field w-28"
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
        </div>
        {contribError && <p className="error-text mb-3">{contribError}</p>}
        <button
          onClick={handleDownloadContributions}
          disabled={contribLoading}
          className="btn-primary gap-2"
        >
          {contribLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Download size={16} /> Download Report
            </>
          )}
        </button>
      </div>

      {/* Wallets report */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet2 size={18} className="text-emerald-600" />
          <h2 className="font-semibold text-slate-900">Wallets Report</h2>
        </div>
        <div className="mb-5">
          <label className="form-label">Format</label>
          <select
            value={walletFormat}
            onChange={(e) => setWalletFormat(e.target.value)}
            className="input-field w-28"
          >
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        {walletError && <p className="error-text mb-3">{walletError}</p>}
        <button
          onClick={handleDownloadWallets}
          disabled={walletLoading}
          className="btn-primary gap-2"
        >
          {walletLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Download size={16} /> Download Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}
