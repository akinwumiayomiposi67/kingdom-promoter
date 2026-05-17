import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  PieChart,
  ArrowUpRight,
  CalendarDays,
  Bell,
  CircleUser,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { getUnreadCount } from "../../api/notifications";
import api from "../../api/axios";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/wallet", icon: Wallet, label: "My Wallet" },
  { to: "/contributions", icon: CreditCard, label: "Contributions" },
  { to: "/contributions/group", icon: PieChart, label: "Group Total" },
  { to: "/disbursements", icon: ArrowUpRight, label: "Disbursements" },
  { to: "/meetings", icon: CalendarDays, label: "Meetings" },
  { to: "/notifications", icon: Bell, label: "Notifications", badge: true },
  { to: "/profile", icon: CircleUser, label: "Profile" },
];

const MOBILE_NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/wallet", icon: Wallet, label: "Wallet" },
  { to: "/contributions", icon: CreditCard, label: "Contribute" },
  { to: "/meetings", icon: CalendarDays, label: "Meetings" },
  { to: "/notifications", icon: Bell, label: "Alerts", badge: true },
];

const TITLES = {
  "/dashboard": "Dashboard",
  "/wallet": "My Wallet",
  "/contributions": "My Contributions",
  "/contributions/group": "Group Total",
  "/disbursements": "Disbursements",
  "/meetings": "Meetings",
  "/notifications": "Notifications",
  "/profile": "My Profile",
  "/onboarding": "Choose Package",
};

export default function MemberLayout() {
  const [open, setOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { unreadCount, setUnreadCount } = useNotificationStore();

  const title = TITLES[location.pathname] ?? "Kingdom Fund Circle";

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await getUnreadCount();
        setUnreadCount(r.data.data?.count ?? 0);
      } catch {
        /* silent */
      }
    };
    fetch();
    const id = setInterval(fetch, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    }
    clearAuth();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/contributions/group") return location.pathname === path;
    if (path === "/contributions")
      return location.pathname === "/contributions";
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const initial = user?.name?.[0]?.toUpperCase() ?? "M";

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
              <p className="text-blue-200 text-xs leading-tight">Fund Circle</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden text-white/60 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* User card */}
        <div className="mx-3 mt-4 p-3 bg-white/10 rounded-xl border border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0 shadow">
              <span className="text-blue-900 font-bold text-sm">{initial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {user?.name ?? "Member"}
              </p>
              <p className="text-blue-300 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label, badge }) => (
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
              {badge && unreadCount > 0 && (
                <span className="bg-amber-400 text-blue-900 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
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
            <Link
              to="/notifications"
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-white" />
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs font-bold">
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
                      to="/profile"
                      onClick={() => setUserMenu(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <CircleUser size={15} className="text-slate-400" />
                      <span>My Profile</span>
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
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav ────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 flex shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        {MOBILE_NAV.map(({ to, icon: Icon, label, badge }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors relative
              ${isActive(to) ? "text-blue-700" : "text-slate-500"}`}
          >
            {isActive(to) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
            )}
            <span className="relative">
              <Icon size={20} />
              {badge && unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
              )}
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
