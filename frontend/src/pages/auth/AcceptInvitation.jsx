import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  User,
  ArrowRight,
  Shield,
} from "lucide-react";
import api from "../../api/axios";

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading | valid | invalid
  const [invitationData, setInvitationData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMessage("No invitation token provided.");
      return;
    }

    const validateToken = async () => {
      try {
        const response = await api.post("/api/invitation/validate", { token });
        setInvitationData(response.data.data);
        setStatus("valid");
      } catch (error) {
        setStatus("invalid");
        setErrorMessage(
          error.response?.data?.message || "Invalid or expired invitation.",
        );
      }
    };

    validateToken();
  }, [token]);

  const handleProceed = () => {
    const params = new URLSearchParams({
      token,
      email: invitationData.email,
      name: invitationData.name,
    });
    navigate(`/register?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-center p-12 bg-sidebar w-96 flex-shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-32 translate-x-32" />
        <div className="relative z-10">
          <Shield size={40} className="text-white mb-6" />
          <h1 className="text-3xl font-bold text-white mb-3">
            Invitation Validation
          </h1>
          <p className="text-blue-200 text-sm">
            Verify your invitation to join Kingdom Fund Circle.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {status === "loading" ? (
          <div className="text-center">
            <Loader2
              size={32}
              className="animate-spin text-brand-600 mx-auto mb-3"
            />
            <p className="text-slate-500">Validating your invitation…</p>
          </div>
        ) : status === "invalid" ? (
          <div className="max-w-sm w-full bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <XCircle size={40} className="text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-red-800 mb-2">
              Invalid Invitation
            </h2>
            <p className="text-red-600 text-sm">{errorMessage}</p>
          </div>
        ) : (
          <div className="max-w-sm w-full">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6 text-center">
              <CheckCircle
                size={40}
                className="text-emerald-500 mx-auto mb-3"
              />
              <h2 className="text-xl font-bold text-emerald-800">
                Valid Invitation
              </h2>
            </div>
            {invitationData && (
              <div className="space-y-3 mb-6">
                <div className="card p-4 flex items-center gap-3">
                  <Mail size={16} className="text-slate-400" />
                  <span className="text-slate-700 text-sm">
                    {invitationData.email}
                  </span>
                </div>
                {invitationData.name && (
                  <div className="card p-4 flex items-center gap-3">
                    <User size={16} className="text-slate-400" />
                    <span className="text-slate-700 text-sm">
                      {invitationData.name}
                    </span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleProceed}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Continue to Registration <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
