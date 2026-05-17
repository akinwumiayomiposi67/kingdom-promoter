import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Users,
  TrendingUp,
  Shield,
} from "lucide-react";
import api from "../../api/axios";
import { useAuthStore } from "../../store/authStore";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const FEATURES = [
  { icon: Users, text: "Trusted by a community of believers" },
  { icon: TrendingUp, text: "Transparent monthly contribution tracking" },
  { icon: Shield, text: "Secure, invitation-only platform" },
];

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      const response = await api.post("/api/auth/login", data);
      const { token, user } = response.data.data;
      setAuth(user, token, user.role);
      navigate(user.role === "admin" ? "/admin/dashboard" : "/dashboard", {
        replace: true,
      });
    } catch (error) {
      if (error.response?.status === 401) {
        setServerError("Invalid email or password.");
      } else if (error.response?.status === 403) {
        setServerError(error.response.data.message || "Account is not active.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left hero */}
      <div className="hidden lg:flex flex-col justify-center p-12 bg-sidebar w-96 xl:w-[480px] flex-shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-brand-500/10 translate-y-24 -translate-x-24" />
        <div className="relative z-10">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Kingdom Fund Circle
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">
            Monthly contribution platform for Christian association members.
          </p>
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 text-blue-100 text-sm"
              >
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={14} />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Welcome back
          </h2>
          <p className="text-slate-500 text-sm mb-8">Sign in to your account</p>

          {serverError && (
            <p className="error-text mb-4 bg-red-50 rounded-xl px-4 py-3">
              {serverError}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                {...register("email")}
                className="input-field"
                placeholder="you@example.com"
                autoFocus
              />
              {errors.email && (
                <p className="error-text">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  {...register("password")}
                  className="input-field pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="error-text">{errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
