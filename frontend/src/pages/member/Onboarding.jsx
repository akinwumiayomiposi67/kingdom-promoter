import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Package, Loader2 } from "lucide-react";
import { getActivePackages, setPackage } from "../../api/contributions";
import formatCurrency from "../../utils/formatCurrency";

export default function Onboarding() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const { data: packagesData, isLoading } = useQuery({
    queryKey: ["active-packages"],
    queryFn: () => getActivePackages().then((r) => r.data.data.packages),
  });

  const mutation = useMutation({
    mutationFn: (packageId) =>
      setPackage({ contribution_package_id: packageId }),
    onSuccess: () => navigate("/dashboard"),
    onError: (err) => {
      setError(
        err.response?.data?.message ??
          "Failed to set package. Please try again.",
      );
    },
  });

  const handleSubmit = () => {
    if (!selected) {
      setError("Please select a package to continue.");
      return;
    }
    setError("");
    mutation.mutate(selected);
  };

  const packages = packagesData ?? [];

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-48 translate-x-48" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-brand-500/10 translate-y-32 -translate-x-32" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Choose Your Package
          </h1>
          <p className="text-blue-200 text-sm">
            Select your monthly contribution tier to get started.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/10 rounded-2xl p-6 h-32 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => setSelected(pkg.id)}
                className={`rounded-2xl p-6 text-left transition-all ${
                  selected === pkg.id
                    ? "bg-white border-2 border-brand-400 shadow-xl"
                    : "bg-white/10 border-2 border-transparent hover:bg-white/20"
                }`}
              >
                <p
                  className={`font-bold text-lg mb-1 ${selected === pkg.id ? "text-brand-700" : "text-white"}`}
                >
                  {pkg.name}
                </p>
                <p
                  className={`text-2xl font-bold ${selected === pkg.id ? "text-emerald-600" : "text-emerald-300"}`}
                >
                  {formatCurrency(pkg.monthly_amount)}
                </p>
                <p
                  className={`text-xs mt-1 ${selected === pkg.id ? "text-slate-500" : "text-blue-200"}`}
                >
                  per month
                </p>
                {selected === pkg.id && (
                  <div className="mt-3 flex items-center gap-1 text-brand-600 text-sm font-medium">
                    <Check size={14} /> Selected
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-red-300 text-sm text-center mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selected || mutation.isPending}
          className="btn-primary w-full gap-2"
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Setting up…
            </>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}
