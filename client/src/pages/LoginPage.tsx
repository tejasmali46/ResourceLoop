import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layers, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';

export const LoginPage: React.FC = () => {
  const { user, isLoading, login, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRoleDashboardPath = (role: UserRole) => {
    if (role === 'STUDENT') return '/student/dashboard';
    if (role === 'FACULTY') return '/approvals';
    if (role === 'HOD') return '/hod/dashboard';
    if (role === 'RESOURCE_MANAGER') return '/manager/dashboard';
    if (role === 'ADMIN') return '/admin/analytics';
    return '/';
  };

  useEffect(() => {
    if (user && !isLoading) {
      navigate(getRoleDashboardPath(user.role), { replace: true });
    }
  }, [user, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      const fromPath = (location.state as any)?.from?.pathname;
      navigate(fromPath || (loggedUser ? getRoleDashboardPath(loggedUser.role) : '/'));
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await switchDemoRole(role);
      const fromPath = (location.state as any)?.from?.pathname;
      navigate(fromPath || getRoleDashboardPath(role));
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Sign in to ResourceLoop</h2>
          <p className="text-xs text-slate-500">Access college resources, approvals, and inventory</p>
        </div>

        {/* 1-Click Demo Logins for Evaluators */}
        <div className="p-4 bg-teal-50/70 border border-teal-200/90 rounded-3xl space-y-3 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>1-Click Evaluator Personas:</span>
            </span>
            <span className="text-[10px] text-teal-800 font-bold bg-teal-100/80 px-2 py-0.5 rounded-full border border-teal-200">
              Instant
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(DEMO_ACCOUNTS) as UserRole[]).map((role) => {
              const demo = DEMO_ACCOUNTS[role];
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleQuickLogin(role)}
                  className="p-2.5 bg-white hover:bg-teal-50 border border-teal-200/80 rounded-2xl text-left transition-all duration-150 cursor-pointer text-xs shadow-subtle hover:shadow-card"
                >
                  <p className="font-bold text-slate-900 leading-snug">{demo.label}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{demo.name}</p>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200/90 text-rose-700 text-xs rounded-2xl font-medium shadow-subtle">
            {error}
          </div>
        )}

        {/* Manual Form */}
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Institutional Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student.ecell@resourceloop.edu"
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">Default demo password for seeded accounts: Password@123</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-600/20 transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          New student representative?{' '}
          <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
};
