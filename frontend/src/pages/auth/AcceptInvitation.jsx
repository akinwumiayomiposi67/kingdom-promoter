import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading | valid | invalid
  const [invitationData, setInvitationData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setErrorMessage('No invitation token provided.');
      return;
    }

    const validateToken = async () => {
      try {
        const response = await api.post('/api/invitation/validate', { token });
        setInvitationData(response.data.data);
        setStatus('valid');
      } catch (error) {
        setStatus('invalid');
        setErrorMessage(
          error.response?.data?.message || 'Invalid or expired invitation.'
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

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Validating your invitation…</p>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow rounded-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Invitation Invalid</h2>
          <p className="text-gray-600">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow rounded-lg p-8 max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-primary">You're invited!</h1>
        <p className="text-gray-600">
          Welcome, <span className="font-semibold">{invitationData.name}</span>!
          Your invitation for <span className="font-semibold">{invitationData.email}</span> is valid.
        </p>
        <button onClick={handleProceed} className="btn-primary w-full">
          Create my account
        </button>
      </div>
    </div>
  );
}
