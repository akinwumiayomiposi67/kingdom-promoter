import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { verify2FA } from '../../api/admin';

export default function TwoFactorVerify() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => verify2FA({ code }),
    onSuccess: () => {
      navigate('/admin/dashboard', { replace: true });
    },
    onError: (err) => {
      setError(
        err?.response?.data?.errors?.code?.[0] ??
        err?.response?.data?.message ??
        'Invalid code. Please try again.'
      );
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3"
            style={{ background: '#1a3c6e' }}
          >
            <span className="text-white text-2xl">🔐</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#1a3c6e' }}>
            Two-Factor Verification
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(''); }}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center tracking-[0.5em] font-mono text-2xl mb-4 focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': '#1a3c6e' }}
          onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && mutation.mutate()}
        />

        {error && (
          <p className="text-red-500 text-xs text-center mb-4">{error}</p>
        )}

        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || code.length !== 6}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-50"
          style={{ background: '#1a3c6e' }}
        >
          {mutation.isPending ? 'Verifying…' : 'Verify Code'}
        </button>
      </div>
    </div>
  );
}
