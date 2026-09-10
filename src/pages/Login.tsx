import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Shield, Sparkles, RefreshCw, AlertCircle, CheckCircle2, UserCheck, User, Skull } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        navigate('/');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Unable to reach authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (u: string, p: string = 'demo123') => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const seedDatabase = async () => {
    try {
      setSeeding(true);
      setSeedNotice(null);
      const res = await fetch('/api/seed/run', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSeedNotice('Academic sample data seeded! Use quick-fill buttons below.');
        setTimeout(() => setSeedNotice(null), 4000);
      } else {
        setError(data.error || 'Failed to seed database');
      }
    } catch (err) {
      setError('Network error seeding database');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200/80 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">TrustNet Authentication</h2>
          <p className="text-xs text-slate-500">Academic Prototype • Social Network Security</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {seedNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{seedNotice}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Username</label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all"
              placeholder="e.g. normal_student"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Password</label>
            <input
              type="password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Quick Demo Accounts for Evaluators */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Academic Demo Personas:</span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
              Demo accounts use password: <span className="font-mono">demo123</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoCredentials('trusted_expert')}
              className="p-2 bg-emerald-50/60 hover:bg-emerald-100/60 border border-emerald-200/80 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                <UserCheck className="w-3 h-3 text-emerald-600" /> Expert
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">High Trust</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoCredentials('normal_student')}
              className="p-2 bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200/80 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-blue-800">
                <User className="w-3 h-3 text-blue-600" /> Student
              </div>
              <div className="text-[10px] text-blue-700 mt-0.5 font-medium">Med Trust</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoCredentials('sc4mm3r')}
              className="p-2 bg-rose-50/60 hover:bg-rose-100/60 border border-rose-200/80 rounded-xl text-left transition-colors"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold text-rose-800">
                <Skull className="w-3 h-3 text-rose-600" /> Spammer
              </div>
              <div className="text-[10px] text-rose-700 mt-0.5 font-medium">High Risk</div>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 text-center space-y-3">
          <Link to="/register" className="text-xs font-semibold text-blue-600 hover:underline block">
            Don't have an account? Register new user
          </Link>

          <button
            type="button"
            onClick={seedDatabase}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium underline transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${seeding ? 'animate-spin' : ''}`} />
            <span>[Demo] Re-seed Database with Academic Users</span>
          </button>
        </div>
      </div>
    </div>
  );
}
