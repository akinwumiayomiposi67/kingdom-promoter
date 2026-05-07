import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .regex(/^(\+?234|0)[789][01]\d{8}$/, 'Please provide a valid Nigerian phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState('');

  const token = searchParams.get('token') ?? '';
  const prefillEmail = searchParams.get('email') ?? '';
  const prefillName = searchParams.get('name') ?? '';

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
    setServerError('');
    try {
      const response = await api.post('/api/auth/register', { ...data, token });
      const { token: authToken, user } = response.data.data;
      setAuth(user, authToken, user.role);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = error.response?.data?.message;
      const validationErrors = error.response?.data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0];
        setServerError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setServerError(message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Kingdom Fund Circle</h1>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-8 space-y-5">
          {serverError && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-3 text-sm">
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="name" className="form-label">Full name</label>
            <input id="name" type="text" className="input-field" {...register('name')} />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input-field bg-gray-50"
              readOnly={!!prefillEmail}
              {...register('email')}
            />
            {errors.email && <p className="error-text">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="form-label">Phone number</label>
            <input id="phone" type="tel" placeholder="e.g. 08012345678" className="input-field" {...register('phone')} />
            {errors.phone && <p className="error-text">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="form-label">Password</label>
            <input id="password" type="password" autoComplete="new-password" className="input-field" {...register('password')} />
            {errors.password && <p className="error-text">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="password_confirmation" className="form-label">Confirm password</label>
            <input id="password_confirmation" type="password" autoComplete="new-password" className="input-field" {...register('password_confirmation')} />
            {errors.password_confirmation && (
              <p className="error-text">{errors.password_confirmation.message}</p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
