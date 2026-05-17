import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Wallet,
  CreditCard,
  ArrowUpRight,
  PieChart,
  CalendarDays,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { getWallet } from "../../api/wallet";
import {
  getMyContributions,
  getGroupContributions,
} from "../../api/contributions";
import { getDisbursements } from "../../api/disbursements";
import { useAuthStore } from "../../store/authStore";
import formatCurrency from "../../utils/formatCurrency";
import Skeleton from "../../components/ui/Skeleton";

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => getWallet().then((r) => r.data.data.wallet),
  });

  const { data: myContributions } = useQuery({
    queryKey: ["my-contributions", 1],
    queryFn: () => getMyContributions(1).then((r) => r.data.data),
  });

  const { data: groupData } = useQuery({
    queryKey: ["group-contributions", 1],
    queryFn: () => getGroupContributions(1).then((r) => r.data.data),
  });

  const { data: disbursementsData } = useQuery({
    queryKey: ["member-disbursements-dashboard"],
    queryFn: () => getDisbursements().then((r) => r.data.data.disbursements),
  });

  const latestDisbursement = disbursementsData?.data?.[0];
  const latestContribution = myContributions?.data?.[0];
  const cycle = groupData?.cycle;
  const groupContributions = groupData?.contributions?.data ?? [];
  const paidCount = groupContributions.filter(
    (c) => c.status === "paid",
  ).length;
  const totalMembers = groupData?.contributions?.total ?? 0;
  const pendingCount = totalMembers - paidCount;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="page-content">
      {/* Greeting hero */}
      <div className="bg-sidebar rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm">{greeting},</p>
        <h1 className="text-2xl font-bold mt-1">
          {user?.name?.split(" ")[0] ?? "Member"} 👋
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            Wallet Balance
          </p>
          {walletLoading ? (
            <div className="h-8 bg-slate-100 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(wallet?.balance ?? 0)}
            </p>
          )}
        </div>
        <div className="card p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            Active Cycle
          </p>
          <p className="text-lg font-bold text-slate-800">
            {cycle?.name ?? "None"}
          </p>
        </div>
      </div>

      {/* Cycle progress */}
      {cycle && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">
              Cycle contributions
            </p>
            <p className="text-xs text-slate-400">
              {paidCount} / {totalMembers} paid
            </p>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-emerald-500 rounded-full transition-all"
              style={{
                width:
                  totalMembers > 0
                    ? `${(paidCount / totalMembers) * 100}%`
                    : "0%",
              }}
            />
          </div>
          <p className="text-xs text-amber-600 mt-2">
            {pendingCount} member{pendingCount !== 1 ? "s" : ""} still pending
          </p>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { to: "/wallet", label: "My Wallet", color: "text-emerald-600" },
          {
            to: "/contributions",
            label: "Contributions",
            color: "text-brand-600",
          },
          {
            to: "/disbursements",
            label: "Disbursements",
            color: "text-violet-600",
          },
          { to: "/meetings", label: "Meetings", color: "text-amber-600" },
        ].map(({ to, label, color }) => (
          <Link
            key={to}
            to={to}
            className="card p-4 text-center hover:shadow-card-md transition-shadow"
          >
            <p className={`text-sm font-semibold ${color}`}>{label}</p>
          </Link>
        ))}
      </div>

      {/* Latest contribution */}
      {latestContribution && (
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              Latest Contribution
            </p>
            <span className={`badge badge-${latestContribution.status}`}>
              {latestContribution.status}
            </span>
          </div>
          <p className="text-2xl font-bold text-brand-700 mt-1">
            {formatCurrency(latestContribution.amount)}
          </p>
          <p className="text-xs text-slate-400">
            {latestContribution.cycle?.name}
          </p>
        </div>
      )}
    </div>
  );
}
