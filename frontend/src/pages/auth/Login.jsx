import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      const response = await api.post('/api/auth/login', data);
      const { token, user } = response.data.data;
      setAuth(user, token, user.role);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true });
    } catch (error) {
      if (error.response?.status === 401) {
        setServerError('Invalid email or password.');
      } else if (error.response?.status === 403) {
        setServerError(error.response.data.message || 'Account is not active.');
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Kingdom Fund Circle</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-8 space-y-6">
          {serverError && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-3 text-sm">
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input-field"
              {...register('email')}
            />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input-field"
              {...register('password')}
            />
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
