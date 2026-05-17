import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Shield, CheckCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { setup2FA, enable2FA, disable2FA } from "../../api/admin";
import PageHeader from "../../components/ui/PageHeader";

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [setupError, setSetupError] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableError, setDisableError] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const setupMutation = useMutation({
    mutationFn: setup2FA,
    onSuccess: (res) => {
      setQrCodeUrl(res.data.data.qr_code_url);
      setSecret(res.data.data.secret);
      setSetupError("");
    },
    onError: () => setSetupError("Failed to start 2FA setup."),
  });

  const enableMutation = useMutation({
    mutationFn: () => enable2FA({ code: totpCode }),
    onSuccess: () => {
      setSuccessMsg("Two-factor authentication enabled successfully!");
      setQrCodeUrl("");
      setSecret("");
      setTotpCode("");
      if (user) setAuth({ ...user, two_factor_enabled: true }, token, role);
    },
    onError: (err) =>
      setSetupError(
        err?.response?.data?.errors?.code?.[0] ??
          "Invalid code. Please try again.",
      ),
  });

  const disableMutation = useMutation({
    mutationFn: () => disable2FA({ password: disablePassword }),
    onSuccess: () => {
      setSuccessMsg("Two-factor authentication disabled.");
      setShowDisable(false);
      setDisablePassword("");
      if (user) setAuth({ ...user, two_factor_enabled: false }, token, role);
    },
    onError: (err) =>
      setDisableError(
        err?.response?.data?.errors?.password?.[0] ?? "Incorrect password.",
      ),
  });

  const twoFaEnabled = user?.two_factor_enabled;

  return (
    <div className="page-content">
      <PageHeader
        title="Settings"
        description="Account and security settings"
      />

      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 text-sm text-emerald-800">
          <CheckCircle size={16} />
          {successMsg}
        </div>
      )}

      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Profile</h2>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-slate-400 w-16">Name</span>
            <span className="font-medium text-slate-800">{user?.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-400 w-16">Email</span>
            <span className="font-medium text-slate-800">{user?.email}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-400 w-16">Role</span>
            <span className="badge badge-active capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield
              size={18}
              className={twoFaEnabled ? "text-emerald-600" : "text-slate-400"}
            />
            <h2 className="font-semibold text-slate-900">
              Two-Factor Authentication
            </h2>
          </div>
          <span className={`badge ${twoFaEnabled ? "badge-active" : ""}`}>
            {twoFaEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        {!twoFaEnabled &&
          (!qrCodeUrl ? (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Protect your account with an authenticator app. Required for all
                admin state-changing actions.
              </p>
              {setupError && <p className="error-text mb-3">{setupError}</p>}
              <button
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending}
                className="btn-primary"
              >
                {setupMutation.isPending ? "Setting up\u2026" : "Enable 2FA"}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Scan with your authenticator app, then enter the 6-digit code to
                confirm.
              </p>
              <div className="flex flex-col items-center mb-5">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeUrl)}&size=200x200`}
                  alt="2FA QR"
                  className="w-48 h-48 border border-slate-200 rounded-xl"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Manual key:{" "}
                  <span className="font-mono font-medium text-slate-700">
                    {secret}
                  </span>
                </p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={totpCode}
                onChange={(e) => {
                  setTotpCode(e.target.value);
                  setSetupError("");
                }}
                className="input-field text-center tracking-widest font-mono text-lg mb-3"
              />
              {setupError && <p className="error-text mb-3">{setupError}</p>}
              <button
                onClick={() => enableMutation.mutate()}
                disabled={enableMutation.isPending || totpCode.length !== 6}
                className="btn-primary w-full"
              >
                {enableMutation.isPending
                  ? "Verifying\u2026"
                  : "Confirm & Enable 2FA"}
              </button>
            </>
          ))}

        {twoFaEnabled &&
          (!showDisable ? (
            <>
              <p className="text-sm text-slate-600 mb-4">
                2FA is active. To disable, confirm your password.
              </p>
              <button
                onClick={() => setShowDisable(true)}
                className="btn-danger"
              >
                Disable 2FA
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={disablePassword}
                onChange={(e) => {
                  setDisablePassword(e.target.value);
                  setDisableError("");
                }}
                className="input-field"
              />
              {disableError && <p className="error-text">{disableError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDisable(false);
                    setDisablePassword("");
                    setDisableError("");
                  }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={() => disableMutation.mutate()}
                  disabled={disableMutation.isPending || !disablePassword}
                  className="btn-danger"
                >
                  {disableMutation.isPending
                    ? "Disabling\u2026"
                    : "Confirm Disable"}
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
description = "Account and security settings";
