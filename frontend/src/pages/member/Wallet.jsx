import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import {
  Wallet2,
  Copy,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { getWallet } from "../../api/wallet";
import formatCurrency from "../../utils/formatCurrency";
import { SkeletonTable } from "../../components/ui/Skeleton";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function Wallet() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => getWallet().then((r) => r.data.data.wallet),
  });

  function copyAccountNumber() {
    if (data?.virtual_account_number) {
      navigator.clipboard.writeText(data.virtual_account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const transactions = data?.transactions?.data ?? [];

  return (
    <div className="page-content">
      {/* Balance card */}
      <div className="bg-sidebar rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Wallet2 size={20} className="text-white" />
          </div>
          <p className="text-blue-200 text-sm">Wallet Balance</p>
        </div>
        {isLoading ? (
          <div className="h-10 bg-white/10 rounded animate-pulse" />
        ) : (
          <p className="text-4xl font-bold">
            {formatCurrency(data?.balance ?? 0)}
          </p>
        )}
      </div>

      {/* Virtual account */}
      {data?.virtual_account_number && (
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Virtual Account</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Bank</span>
              <span className="font-medium text-slate-700">
                {data.bank_name ?? data.virtual_account?.bank_name ?? "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Account Number</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-slate-800">
                  {data.virtual_account_number}
                </span>
                <button
                  onClick={copyAccountNumber}
                  className="text-slate-400 hover:text-brand-600"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account Name</span>
              <span className="font-medium text-slate-700">
                {data.account_name ?? data.virtual_account?.account_name ?? "—"}
              </span>
            </div>
          </div>
          <p className="text-amber-600 text-xs mt-3 bg-amber-50 rounded-lg px-3 py-2">
            Send funds to this account to top up your wallet.
          </p>
        </div>
      )}

      {/* Transactions */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3">
          Recent Transactions
        </h3>
        {isLoading ? (
          <SkeletonTable rows={4} cols={4} />
        ) : transactions.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Wallet2}
              title="No transactions"
              description="Your transaction history will appear here."
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-auto w-full">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td>
                        {t.type === "credit" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-sm">
                            <ArrowDownLeft size={14} /> Credit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500 text-sm">
                            <ArrowUpRight size={14} /> Debit
                          </span>
                        )}
                      </td>
                      <td className="text-slate-600 text-sm">
                        {t.description ?? "—"}
                      </td>
                      <td
                        className={`text-right font-semibold ${t.type === "credit" ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="text-slate-400 text-sm">
                        {t.created_at
                          ? format(new Date(t.created_at), "MMM d")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
