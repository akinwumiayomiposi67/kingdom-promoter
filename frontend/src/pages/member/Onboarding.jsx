import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getPackages, setPackage } from '../../api/contributions';
import { formatCurrency } from '../../utils/formatCurrency';

const PACKAGE_STYLES = {
  Bronze:  { border: 'border-amber-600',  badge: 'bg-amber-100 text-amber-800',  icon: '🥉' },
  Silver:  { border: 'border-gray-400',   badge: 'bg-gray-100 text-gray-700',    icon: '🥈' },
  Gold:    { border: 'border-yellow-500', badge: 'bg-yellow-100 text-yellow-800', icon: '🥇' },
  Diamond: { border: 'border-blue-500',   badge: 'bg-blue-100 text-blue-800',    icon: '💎' },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  const { data: packagesData, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: () => getPackages().then((r) => r.data.data.packages),
  });

  const mutation = useMutation({
    mutationFn: (packageId) => setPackage({ contribution_package_id: packageId }),
    onSuccess: () => navigate('/dashboard'),
    onError: (err) => {
      setError(err.response?.data?.message ?? 'Failed to set package. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (!selected) {
      setError('Please select a package to continue.');
      return;
    }
    setError('');
    mutation.mutate(selected);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#1a3c6e' }}>
            Welcome to Kingdom Fund Circle
          </h1>
          <p className="text-gray-600 mt-2">
            Choose your monthly contribution package to get started.
          </p>
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500">Loading packages…</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {(packagesData ?? []).map((pkg) => {
              const style = PACKAGE_STYLES[pkg.name] ?? { border: 'border-gray-300', badge: 'bg-gray-100 text-gray-700', icon: '📦' };
              const isSelected = selected === pkg.id;
              return (
                <button
                  key={pkg.id}
                  onClick={() => setSelected(pkg.id)}
                  className={`relative rounded-xl border-2 p-6 text-left transition-all focus:outline-none
                    ${style.border}
                    ${isSelected ? 'ring-2 ring-offset-2 shadow-lg' : 'hover:shadow-md bg-white'}
                  `}
                  style={isSelected ? { ringColor: '#1a3c6e' } : {}}
                >
                  {isSelected && (
                    <span className="absolute top-3 right-3 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: '#1a3c6e' }}>
                      Selected ✓
                    </span>
                  )}
                  <span className="text-3xl">{style.icon}</span>
                  <h2 className="text-xl font-bold mt-2" style={{ color: '#1a3c6e' }}>{pkg.name}</h2>
                  <p className="text-2xl font-semibold mt-1" style={{ color: '#f59e0b' }}>
                    {formatCurrency(pkg.amount)}
                  </p>
                  {pkg.description && (
                    <p className="text-sm text-gray-500 mt-2">{pkg.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm text-center mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={mutation.isPending || isLoading}
          className="w-full py-3 rounded-xl text-white font-semibold text-base transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#1a3c6e' }}
        >
          {mutation.isPending ? 'Saving…' : 'Confirm Package & Continue'}
        </button>
      </div>
    </div>
  );
}
