import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth pages
import Login from "./pages/auth/Login";
import AcceptInvitation from "./pages/auth/AcceptInvitation";
import Register from "./pages/auth/Register";

// Member pages
import Dashboard from "./pages/member/Dashboard";
import Wallet from "./pages/member/Wallet";
import Onboarding from "./pages/member/Onboarding";
import MyContributions from "./pages/member/MyContributions";
import GroupContributions from "./pages/member/GroupContributions";
import Disbursements from "./pages/member/Disbursements";
import Meetings from "./pages/member/Meetings";
import Notifications from "./pages/member/Notifications";
import Profile from "./pages/member/Profile";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import Members from "./pages/admin/Members";
import AdminWallets from "./pages/admin/AdminWallets";
import ContributionPackages from "./pages/admin/ContributionPackages";
import MonthlyContributions from "./pages/admin/MonthlyContributions";
import AdminDisbursements from "./pages/admin/Disbursements";
import AdminMeetings from "./pages/admin/Meetings";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import TwoFactorVerify from "./pages/admin/TwoFactorVerify";

// Layouts
import MemberLayout from "./components/layout/MemberLayout";
import AdminLayout from "./components/layout/AdminLayout";

// Guards
import ProtectedRoute from "./components/guards/ProtectedRoute";
import MemberRoute from "./components/guards/MemberRoute";
import AdminRoute from "./components/guards/AdminRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ── Public auth routes ─────────────────────── */}
        <Route path="/login" element={<Login />} />
        <Route path="/invite" element={<AcceptInvitation />} />
        <Route path="/register" element={<Register />} />

        {/* ── Member routes (guard → layout → pages) ── */}
        <Route element={<MemberRoute />}>
          <Route element={<MemberLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/contributions" element={<MyContributions />} />
            <Route
              path="/contributions/group"
              element={<GroupContributions />}
            />
            <Route path="/disbursements" element={<Disbursements />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* ── Admin routes (guard → layout → pages) ─── */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/members" element={<Members />} />
            <Route path="/admin/wallets" element={<AdminWallets />} />
            <Route path="/admin/packages" element={<ContributionPackages />} />
            <Route path="/admin/cycles" element={<MonthlyContributions />} />
            <Route
              path="/admin/disbursements"
              element={<AdminDisbursements />}
            />
            <Route path="/admin/meetings" element={<AdminMeetings />} />
            <Route path="/admin/reports" element={<Reports />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* ── 2FA verify (auth only, no layout) ──────── */}
        <Route
          path="/admin/2fa/verify"
          element={
            <ProtectedRoute>
              <TwoFactorVerify />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
