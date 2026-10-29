import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Mail, Lock, User as UserIcon, Building, ArrowRight } from 'lucide-react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [clubId, setClubId] = useState('');

  const [departments, setDepartments] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getDepartments(), api.getClubs()])
      .then(([dRes, cRes]) => {
        if (dRes.success) setDepartments(dRes.departments);
        if (cRes.success) setClubs(cRes.clubs);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.register({
        name,
        email,
        password,
        studentOrEmpId: studentId,
        department: departmentId || undefined,
        clubId: clubId || undefined,
      });
      if (res.success) {
        localStorage.setItem('resourceloop_token', res.token);
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Student Club Registration</h2>
          <p className="text-xs text-slate-500">Register as a club representative or project organizer</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200/90 text-rose-700 text-xs rounded-2xl font-medium shadow-subtle">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Patel"
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Institutional Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@resourceloop.edu"
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">PRN / Student ID</label>
            <input
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. PRN-2024-0083"
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="">Select Dept</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Organizing Club</label>
              <select
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              >
                <option value="">Select Club</option>
                {clubs.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-600/20 transition-all duration-150 flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-teal-600 hover:text-teal-700">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
