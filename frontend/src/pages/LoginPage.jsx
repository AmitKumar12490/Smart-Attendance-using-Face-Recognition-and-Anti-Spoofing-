import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '../components/common/Logo';
import { Lock, Mail, ArrowRight, ShieldCheck, Camera, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@smartattend3d.io');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        if (res.user.role === 'ADMIN' || res.user.role === 'SECURITY_OFFICER') {
          navigate('/');
        } else {
          navigate('/my-portal');
        }
      } else {
        setError(res.error || 'Invalid email address or password.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication server unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'ADMIN') {
      setEmail('admin@smartattend3d.io');
      setPassword('Admin@123');
    } else if (role === 'SECURITY') {
      setEmail('security@smartattend3d.io');
      setPassword('Security@123');
    } else {
      setEmail('aarav.sharma@smartattend3d.io');
      setPassword('Employee@123');
    }
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <Logo size="lg" showText={false} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
          SmartAttend
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#6b7280]">
          Workplace attendance and biometric security platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="apple-card p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Demo Accounts */}
          <div>
            <span className="block text-[11px] font-medium text-[#86868b] uppercase tracking-wider mb-2">
              Instant Demo Access
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('ADMIN')}
                className="py-1.5 px-2 rounded-lg border border-gray-200/90 text-xs font-medium text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('SECURITY')}
                className="py-1.5 px-2 rounded-lg border border-gray-200/90 text-xs font-medium text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                Security
              </button>
              <button
                type="button"
                onClick={() => fillDemo('EMPLOYEE')}
                className="py-1.5 px-2 rounded-lg border border-gray-200/90 text-xs font-medium text-gray-800 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                Employee
              </button>
            </div>
          </div>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-400">or enter credentials</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="apple-input w-full pl-9 pr-3 py-2 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="apple-input w-full pl-9 pr-3 py-2 text-xs"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="apple-btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick link to Attendance Kiosk Scanner */}
          <div className="pt-4 border-t border-gray-100 text-center">
            <Link
              to="/mark-attendance"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0071e3] hover:underline"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Open Biometric Attendance Kiosk</span>
            </Link>
          </div>
        </div>

        <p className="text-center text-[11px] text-[#86868b] mt-6">
          Secured with SHA-256 JWT encryption & multi-spectral biometric anti-spoofing.
        </p>
      </div>
    </div>
  );
};
