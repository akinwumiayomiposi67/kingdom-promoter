import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, Users, TrendingUp, Shield, Loader2 } from "lucide-react";
import api from "../../api/axios";
import { useAuthStore } from "../../store/authStore";

const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(255),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .regex(
        /^(\+?234|0)[789][01]\d{8}$/,
        "Please provide a valid Nigerian phone number",
      ),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const token = searchParams.get("token") ?? "";
  const prefillEmail = searchParams.get("email") ?? "";
  const prefillName = searchParams.get("name") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: prefillName,
      email: prefillEmail,
    },
  });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      const response = await api.post("/api/auth/register", { ...data, token });
      const { token: authToken, user } = response.data.data;
      setAuth(user, authToken, user.role);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error.response?.data?.message;
      const validationErrors = error.response?.data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0];
        setServerError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setServerError(message || "Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-center p-12 bg-sidebar w-96 xl:w-[480px] flex-shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-32 translate-x-32" />
        <div className="relative z-10">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
            <Users size={22} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Join the Circle
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed mb-8">
            Complete your registration to start contributing monthly.
          </p>
          <div className="space-y-3">
            {[
              { icon: Shield, text: "Secure, invitation-only access" },
              { icon: TrendingUp, text: "Track your contributions" },
            ].map(({ icon: Icon, text }) => (
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

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Create your account
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Invitation:{" "}
            <span className="font-medium text-brand-600">
              {token ? `${token.substring(0, 8)}…` : "None"}
            </span>
          </p>

          {serverError && (
            <p className="error-text mb-4 bg-red-50 rounded-xl px-4 py-3">
              {serverError}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                {...register("name")}
                className="input-field"
                placeholder="Your full name"
              />
              {errors.name && (
                <p className="error-text">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                {...register("email")}
                className="input-field"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="error-text">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                {...register("phone")}
                className="input-field"
                placeholder="08012345678"
              />
              {errors.phone && (
                <p className="error-text">{errors.phone.message}</p>
              )}
            </div>
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="input-field pr-10"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="error-text">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label className="form-label">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  {...register("password_confirmation")}
                  className="input-field pr-10"
                  placeholder="Repeat password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="error-text">
                  {errors.password_confirmation.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>
            <p className="text-center text-slate-500 text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-brand-600 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
