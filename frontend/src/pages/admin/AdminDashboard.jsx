import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  Wallet,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  RefreshCcw,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { getDashboardStats } from "../../api/admin";
import { getCycles, triggerDebit } from "../../api/admin";
import formatCurrency from "../../utils/formatCurrency";
import Skeleton from "../../components/ui/Skeleton";

const StatCard = ({ icon: Icon, label, value, sub, color, bg, to }) => {
  const content = (
    <div
      className={`card p-5 group ${to ? "hover:shadow-card-md transition-shadow cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}
        >
          <Icon size={18} className={color} />
        </div>
        {to && (
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-blue-500 transition-colors"
          />
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-slate-500 text-xs mt-0.5">{label}</p>
      {sub && <p className="text-slate-400 text-xs mt-0.5">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
};

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => getDashboardStats().then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const { data: cyclesData } = useQuery({
    queryKey: ["admin-cycles"],
    queryFn: () => getCycles().then((r) => r.data.data),
  });

  const { data: disbursementsData } = useQuery({
    queryKey: ["admin-disbursements-dashboard"],
    queryFn: () =>
      import("../../api/axios").then(({ default: api }) =>
        api.get("/admin/disbursements").then((r) => r.data.data.disbursements),
      ),
  });

  const cycles = cyclesData ?? [];
  const disbursements = disbursementsData?.data ?? [];

  const completedCycles = cycles.filter((c) => c.status === "closed");
  const disbursedIds = new Set(
    disbursements.map((d) => d.contribution_cycle_id),
  );
  const undisbursed = completedCycles.filter((c) => !disbursedIds.has(c.id));

  const s = stats ?? {};

  return (
    <div className="page-content">
      {s.failed_jobs_count > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">
              {s.failed_jobs_count} failed job
              {s.failed_jobs_count > 1 ? "s" : ""} in queue
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Check the failed_jobs table and retry or clear them.
            </p>
          </div>
        </div>
      )}

      {undisbursed.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">
            {undisbursed.length} closed cycle{undisbursed.length > 1 ? "s" : ""}{" "}
            without disbursement
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-24" />
          ))
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Members"
              value={s.total_members ?? 0}
              bg="bg-blue-50"
              color="text-blue-600"
              to="/admin/members"
            />
            <StatCard
              icon={Wallet}
              label="Total Wallet Balance"
              value={formatCurrency(s.total_wallet_balance ?? 0)}
              bg="bg-emerald-50"
              color="text-emerald-600"
            />
            <StatCard
              icon={CheckCircle}
              label="Contributions This Cycle"
              value={s.contributions_this_cycle ?? 0}
              bg="bg-violet-50"
              color="text-violet-600"
              to="/admin/contributions"
            />
            <StatCard
              icon={Clock}
              label="Pending Contributions"
              value={s.pending_contributions ?? 0}
              bg="bg-amber-50"
              color="text-amber-600"
            />
          </>
        )}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            to: "/admin/members",
            icon: Users,
            label: "Members",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            to: "/admin/cycles",
            icon: RefreshCcw,
            label: "Cycles",
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            to: "/admin/disbursements",
            icon: ArrowUpRight,
            label: "Disburse",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            to: "/admin/reports",
            icon: BarChart3,
            label: "Reports",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map(({ to, icon: Icon, label, color, bg }) => (
          <Link
            key={to}
            to={to}
            className="card p-4 flex flex-col items-center gap-2 hover:shadow-card-md transition-shadow"
          >
            <div
              className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}
            >
              <Icon size={18} className={color} />
            </div>
            <span className="text-slate-600 text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
