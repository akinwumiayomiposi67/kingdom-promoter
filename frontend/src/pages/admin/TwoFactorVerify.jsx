import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Shield, Loader2 } from "lucide-react";
import { verify2FA } from "../../api/admin";

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => verify2FA({ code }),
    onSuccess: () => navigate("/admin/dashboard", { replace: true }),
    onError: (err) => {
      setError(
        err?.response?.data?.errors?.code?.[0] ??
          err?.response?.data?.message ??
          "Invalid code. Please try again.",
      );
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-48 translate-x-48" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-brand-500/10 translate-y-32 -translate-x-32" />

      <div className="relative z-10 bg-white rounded-2xl shadow-card-lg p-8 w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield size={26} className="text-brand-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Two-Factor Verification
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError("");
          }}
          className="input-field text-center tracking-[0.5em] font-mono text-2xl mb-4"
          onKeyDown={(e) =>
            e.key === "Enter" && code.length === 6 && mutation.mutate()
          }
          autoFocus
        />

        {error && <p className="error-text text-center mb-4">{error}</p>}

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || code.length !== 6}
          className="btn-primary w-full gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Verifying…
            </>
          ) : (
            "Verify Code"
          )}
        </button>
      </div>
    </div>
  );
}
