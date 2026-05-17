import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Package,
  RefreshCcw,
  ArrowUpRight,
  CalendarDays,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronDown,
  Shield,
  Bell,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import api from "../../api/axios";

const NAV = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/members", icon: Users, label: "Members" },
  { to: "/admin/wallets", icon: Wallet, label: "Wallets" },
  { to: "/admin/packages", icon: Package, label: "Packages" },
  { to: "/admin/cycles", icon: RefreshCcw, label: "Cycles" },
  { to: "/admin/disbursements", icon: ArrowUpRight, label: "Disbursements" },
  { to: "/admin/meetings", icon: CalendarDays, label: "Meetings" },
  { to: "/admin/reports", icon: BarChart3, label: "Reports" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

const TITLES = {
  "/admin/dashboard": "Dashboard",
  "/admin/members": "Members",
  "/admin/wallets": "Wallets",
  "/admin/packages": "Contribution Packages",
  "/admin/cycles": "Monthly Cycles",
  "/admin/disbursements": "Disbursements",
  "/admin/meetings": "Meetings",
  "/admin/reports": "Reports",
  "/admin/settings": "Settings",
};

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const title = TITLES[location.pathname] ?? "Admin Panel";
  const initial = user?.name?.[0]?.toUpperCase() ?? "A";

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-sidebar shadow-card-lg
          transform transition-transform duration-300 lg:static lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center flex-shrink-0 shadow">
              <span className="text-blue-900 font-black text-sm">K</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">
                Kingdom
              </p>
              <p className="text-blue-200 text-xs leading-tight">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-white/60 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin badge */}
        <div className="mx-3 mt-4 px-3 py-2 bg-amber-400/10 border border-amber-400/30 rounded-xl flex items-center gap-2.5 flex-shrink-0">
          <Shield size={15} className="text-amber-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {user?.name ?? "Admin"}
            </p>
            <p className="text-amber-300/80 text-xs">Administrator</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                ${
                  isActive(to)
                    ? "bg-white text-blue-900 shadow-sm"
                    : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                }`}
            >
              <Icon
                size={17}
                className={
                  isActive(to)
                    ? "text-blue-600"
                    : "text-blue-300/80 group-hover:text-white"
                }
              />
              <span className="flex-1">{label}</span>
              {isActive(to) && (
                <ChevronRight
                  size={13}
                  className="text-blue-400 flex-shrink-0"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-slate-800 font-semibold text-base lg:text-lg">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-blue-900 text-xs font-bold">
                    {initial}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                  {user?.name}
                </span>
                <ChevronDown
                  size={14}
                  className="text-slate-400 hidden sm:block"
                />
              </button>

              {userMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-card-lg border border-slate-100 py-1 z-50 animate-fade-in">
                    <Link
                      to="/admin/settings"
                      onClick={() => setUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Settings size={15} className="text-slate-400" />
                      <span>Settings</span>
                    </Link>
                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={15} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
