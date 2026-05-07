import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { setup2FA, enable2FA, disable2FA } from '../../api/admin';

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [setupError, setSetupError] = useState('');

  const [disablePassword, setDisablePassword] = useState('');
  const [disableError, setDisableError] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');

  const setupMutation = useMutation({
    mutationFn: setup2FA,
    onSuccess: (res) => {
      setQrCodeUrl(res.data.data.qr_code_url);
      setSecret(res.data.data.secret);
      setSetupError('');
    },
    onError: () => setSetupError('Failed to start 2FA setup.'),
  });

  const enableMutation = useMutation({
    mutationFn: () => enable2FA({ code: totpCode }),
    onSuccess: () => {
      setSuccessMsg('Two-factor authentication enabled successfully!');
      setQrCodeUrl('');
      setSecret('');
      setTotpCode('');
      // Update user in store
      if (user) {
        setAuth({ ...user, two_factor_enabled: true }, token, role);
      }
    },
    onError: (err) => {
      setSetupError(err?.response?.data?.errors?.code?.[0] ?? 'Invalid code. Please try again.');
    },
  });

  const disableMutation = useMutation({
    mutationFn: () => disable2FA({ password: disablePassword }),
    onSuccess: () => {
      setSuccessMsg('Two-factor authentication disabled.');
      setShowDisable(false);
      setDisablePassword('');
      if (user) {
        setAuth({ ...user, two_factor_enabled: false }, token, role);
      }
    },
    onError: (err) => {
      setDisableError(err?.response?.data?.errors?.password?.[0] ?? 'Incorrect password.');
    },
  });

  const twoFaEnabled = user?.two_factor_enabled;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#1a3c6e' }}>Settings</h1>

        {successMsg && (
          <div className="bg-green-50 border border-green-300 rounded-xl px-5 py-4 mb-6">
            <p className="text-sm text-green-800">{successMsg}</p>
          </div>
        )}

        {/* Profile card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#1a3c6e' }}>Profile</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p><span className="font-medium text-gray-500">Name:</span> {user?.name}</p>
            <p><span className="font-medium text-gray-500">Email:</span> {user?.email}</p>
            <p><span className="font-medium text-gray-500">Role:</span> {user?.role}</p>
          </div>
        </div>

        {/* 2FA card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: '#1a3c6e' }}>
              Two-Factor Authentication
            </h2>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                twoFaEnabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {twoFaEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {!twoFaEnabled && (
            <>
              {!qrCodeUrl ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Protect your account with an authenticator app. You will be required to enter
                    a 6-digit code on each admin login.
                  </p>
                  {setupMutation.isError && <p className="text-red-500 text-xs mb-3">{setupError}</p>}
                  <button
                    onClick={() => setupMutation.mutate()}
                    disabled={setupMutation.isPending}
                    className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: '#1a3c6e' }}
                  >
                    {setupMutation.isPending ? 'Setting up…' : 'Enable 2FA'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Scan the QR code below with your authenticator app (e.g. Google Authenticator),
                    then enter the 6-digit code to confirm.
                  </p>
                  <div className="flex flex-col items-center mb-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeUrl)}&size=200x200`}
                      alt="2FA QR Code"
                      className="w-48 h-48 border border-gray-200 rounded-lg"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Manual key: <span className="font-mono font-medium">{secret}</span>
                    </p>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={totpCode}
                    onChange={(e) => { setTotpCode(e.target.value); setSetupError(''); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 text-center tracking-widest font-mono text-lg"
                  />
                  {setupError && <p className="text-red-500 text-xs mb-3">{setupError}</p>}
                  <button
                    onClick={() => enableMutation.mutate()}
                    disabled={enableMutation.isPending || totpCode.length !== 6}
                    className="w-full px-5 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: '#1a3c6e' }}
                  >
                    {enableMutation.isPending ? 'Verifying…' : 'Confirm & Enable 2FA'}
                  </button>
                </>
              )}
            </>
          )}

          {twoFaEnabled && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Two-factor authentication is active. To disable it, confirm your password below.
              </p>
              {!showDisable ? (
                <button
                  onClick={() => setShowDisable(true)}
                  className="px-5 py-2 rounded-lg text-sm font-semibold border border-red-300 text-red-600 hover:bg-red-50"
                >
                  Disable 2FA
                </button>
              ) : (
                <>
                  <input
                    type="password"
                    placeholder="Current password"
                    value={disablePassword}
                    onChange={(e) => { setDisablePassword(e.target.value); setDisableError(''); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
                  />
                  {disableError && <p className="text-red-500 text-xs mb-3">{disableError}</p>}
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowDisable(false); setDisablePassword(''); setDisableError(''); }}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => disableMutation.mutate()}
                      disabled={disableMutation.isPending || !disablePassword}
                      className="px-4 py-2 text-sm rounded-lg font-semibold text-white bg-red-600"
                    >
                      {disableMutation.isPending ? 'Disabling…' : 'Confirm Disable'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
