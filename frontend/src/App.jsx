import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import AcceptInvitation from './pages/auth/AcceptInvitation';
import Register from './pages/auth/Register';
import Dashboard from './pages/member/Dashboard';
import Wallet from './pages/member/Wallet';
import Onboarding from './pages/member/Onboarding';
import MyContributions from './pages/member/MyContributions';
import GroupContributions from './pages/member/GroupContributions';
import Disbursements from './pages/member/Disbursements';
import Meetings from './pages/member/Meetings';
import Notifications from './pages/member/Notifications';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDisbursements from './pages/admin/Disbursements';
import AdminMeetings from './pages/admin/Meetings';
import Members from './pages/admin/Members';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import TwoFactorVerify from './pages/admin/TwoFactorVerify';
import AdminWallets from './pages/admin/AdminWallets';
import ProtectedRoute from './components/guards/ProtectedRoute';
import MemberRoute from './components/guards/MemberRoute';
import AdminRoute from './components/guards/AdminRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/invite" element={<AcceptInvitation />} />
        <Route path="/register" element={<Register />} />

        {/* Member routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MemberRoute>
                <Dashboard />
              </MemberRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <MemberRoute>
                <Wallet />
              </MemberRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <MemberRoute>
                <Onboarding />
              </MemberRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contributions"
          element={
            <ProtectedRoute>
              <MemberRoute>
                <MyContributions />
              </MemberRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contributions/group"
          element={
            <ProtectedRoute>
              <MemberRoute>
                <GroupContributions />
              </MemberRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/disbursements"
          element={
            <ProtectedRoute>
              <MemberRoute>
                <Disbursements />
              </MemberRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/meetings"
          element={
            <ProtectedRoute>
              <MemberRoute>
                <Meetings />
              </MemberRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <MemberRoute>
                <Notifications />
              </MemberRoute>
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/disbursements"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminDisbursements />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/meetings"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminMeetings />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/members"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <Members />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/wallets"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminWallets />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <Reports />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <Settings />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        {/* 2FA verify — shown after login, requires auth but not full admin guard */}
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
