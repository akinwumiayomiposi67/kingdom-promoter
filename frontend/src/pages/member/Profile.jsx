import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CircleUser,
  Mail,
  Phone,
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import api from "../../api/axios";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";

export default function Profile() {
  const { user, setAuth, token, role } = useAuthStore();
  const qc = useQueryClient();
  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const changePwd = useMutation({
    mutationFn: (data) => api.put("/member/profile/password", data),
    onSuccess: () => {
      setPwdForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      setPwdSuccess(true);
      setTimeout(() => setPwdSuccess(false), 3000);
      setPwdError("");
    },
    onError: (err) => {
      setPwdError(err?.response?.data?.message ?? "Password change failed");
    },
  });

  const initial = user?.name?.[0]?.toUpperCase() ?? "M";

  return (
    <div className="page-content">
      <PageHeader title="My Profile" description="Your account information" />

      {/* Avatar & info */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-sidebar flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {initial}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-lg leading-tight">
              {user?.name}
            </p>
            <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
              <Mail size={13} /> {user?.email}
            </p>
            {user?.phone && (
              <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                <Phone size={13} /> {user.phone}
              </p>
            )}
            <span className="badge badge-active capitalize mt-2 inline-block">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-brand-600" />
          <h2 className="font-semibold text-slate-900">Change Password</h2>
        </div>

        {pwdSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800 mb-4">
            <CheckCircle size={15} /> Password updated successfully.
          </div>
        )}
        {pwdError && <p className="error-text mb-4">{pwdError}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPwdError("");
            if (pwdForm.password !== pwdForm.password_confirmation) {
              setPwdError("Passwords do not match.");
              return;
            }
            pwdMutation.mutate(pwdForm);
          }}
          className="space-y-4 max-w-sm"
        >
          <div>
            <label className="form-label">Current Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={pwdForm.current_password}
                onChange={(e) =>
                  setPwdForm({ ...pwdForm, current_password: e.target.value })
                }
                required
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="form-label">New Password</label>
            <input
              type="password"
              value={pwdForm.password}
              onChange={(e) =>
                setPwdForm({ ...pwdForm, password: e.target.value })
              }
              required
              minLength={8}
              className="input-field"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              value={pwdForm.password_confirmation}
              onChange={(e) =>
                setPwdForm({
                  ...pwdForm,
                  password_confirmation: e.target.value,
                })
              }
              required
              className="input-field"
            />
          </div>
          <button
            type="submit"
            disabled={pwdMutation.isPending}
            className="btn-primary gap-2"
          >
            {pwdMutation.isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Updating…
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
