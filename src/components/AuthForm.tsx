import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Sheet as Sheep, Shield, Users } from 'lucide-react';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'staff' | 'veterinarian';
  created_at?: string;
}

interface AuthFormProps {
  mode: 'login' | 'register';
  onAuth: (user: User) => void;
  onBack: () => void;
}

export default function AuthForm({ mode, onAuth, onBack }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'staff' | 'veterinarian'>('staff');
  const [adminCode, setAdminCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdminRegistration, setIsAdminRegistration] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      });

      if (resetError) throw resetError;

      setResetEmailSent(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // Get user profile from users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, email, full_name, role')
            .eq('id', authData.user.id)
            .single();

          if (userError) {
            console.error('Error fetching user profile:', userError);
            throw new Error('Failed to load user profile');
          }

          onAuth(userData);
        }
      } else {
        // Registration
        const finalRole = isAdminRegistration ? 'admin' : role;

        // Validate admin code if admin registration
        if (isAdminRegistration && adminCode !== 'SHEEP_ADMIN_2024') {
          throw new Error('Invalid admin code');
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined,
          },
        });

        if (authError) {
          if (authError.message === 'User already registered') {
            throw new Error('This email is already registered. Please log in instead.');
          }
          throw authError;
        }

        if (authData.user) {
          // Create user profile in users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([
              {
                id: authData.user.id,
                email,
                full_name: fullName,
                role: finalRole,
              },
            ])
            .select('id, email, full_name, role')
            .single();

          if (userError) {
            console.error('Error creating user profile:', userError);
            throw new Error('Failed to create user profile');
          }

          onAuth(userData);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="form-glass rounded-2xl shadow-xl p-8 border border-green-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4">
                <Sheep className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Reset Password
              </h2>
              <p className="text-gray-600 mt-2">
                Enter your email to receive a password reset link
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {resetEmailSent ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                <p className="font-medium">Email sent!</p>
                <p className="text-sm mt-1">
                  Check your email for a password reset link. If you don't see it, check your spam folder.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                    placeholder="Enter your email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmailSent(false);
                  setError('');
                }}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="form-glass rounded-2xl shadow-xl p-8 border border-green-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4">
              <Sheep className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {mode === 'login' ? 'Welcome Back' : isAdminRegistration ? 'Admin Registration' : 'Join Our Farm'}
            </h2>
            <p className="text-gray-600 mt-2">
              {mode === 'login'
                ? 'Sign in to manage your sheep farm'
                : isAdminRegistration
                ? 'Create an administrator account'
                : 'Create your account to get started'
              }
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {mode === 'register' && isAdminRegistration && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                <span className="font-medium">Admin Registration</span>
              </div>
              <p className="text-sm mt-1">
                You need a special admin code to create an administrator account.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {mode === 'register' && !isAdminRegistration && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'staff' | 'veterinarian')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                >
                  <option value="staff">Staff</option>
                  <option value="veterinarian">Veterinarian</option>
                </select>
              </div>
            )}

            {mode === 'register' && isAdminRegistration && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Code
                </label>
                <input
                  type="password"
                  required
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                  placeholder="Enter admin code"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 ${
                isAdminRegistration
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-0.5'}`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                mode === 'login' ? 'Sign In' : isAdminRegistration ? 'Create Admin Account' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
            {mode === 'login' && (
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                Forgot Password?
              </button>
            )}
            {mode === 'register' && (
              <button
                onClick={() => setIsAdminRegistration(!isAdminRegistration)}
                className={`text-sm font-medium transition-colors ${
                  isAdminRegistration
                    ? 'text-green-600 hover:text-green-700'
                    : 'text-red-600 hover:text-red-700'
                }`}
              >
                {isAdminRegistration ? (
                  <span className="flex items-center justify-center">
                    <Users className="w-4 h-4 mr-1" />
                    Regular Registration
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Shield className="w-4 h-4 mr-1" />
                    Admin Registration
                  </span>
                )}
              </button>
            )}
            
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}