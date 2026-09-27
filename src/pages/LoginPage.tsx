import React, { useState } from 'react';
import { Shield, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api';

interface LoginPageProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('supervisor');
  const [password, setPassword] = useState('supervisor123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ username, password });
      localStorage.setItem('sat_sa_token', res.token);
      localStorage.setItem('sat_sa_user', JSON.stringify(res.user));
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Subtle Cyber Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] mb-1">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xl font-black text-slate-100 tracking-wider">SAT-SA</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
              NCIIPC
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400">
            Supervisory Analytics Tool for SOC Assessment
          </p>
          <p className="text-[11px] font-mono text-cyan-400/90 italic">
            "From SOC Data to Supervisory Intelligence"
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-950/80 border border-red-800 text-xs font-mono text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300 font-medium block">
              Supervisory Identity (Username / Email):
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="supervisor"
                required
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300 font-medium block">
              Clearance Password:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded font-mono font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating Clearance...' : 'Authenticate & Enter Platform'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Demo Role Selector */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider text-center">
            Demo Supervisory Clearances (1-Click Switch)
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => quickFill('supervisor', 'supervisor123')}
              className="p-2 rounded bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-800 text-slate-300 text-center transition"
            >
              <strong className="block text-cyan-400">SUPERVISOR</strong>
              <span>supervisor123</span>
            </button>

            <button
              type="button"
              onClick={() => quickFill('admin', 'admin123')}
              className="p-2 rounded bg-slate-950 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-800 text-slate-300 text-center transition"
            >
              <strong className="block text-blue-400">ADMIN</strong>
              <span>admin123</span>
            </button>

            <button
              type="button"
              onClick={() => quickFill('viewer', 'viewer123')}
              className="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-center transition"
            >
              <strong className="block text-slate-400">VIEWER</strong>
              <span>viewer123</span>
            </button>
          </div>
        </div>

        {/* Air-gapped badge */}
        <div className="text-center text-[10px] font-mono text-slate-600">
          AIR-GAPPED RESTRICTED SESSION • LOCAL AUTHENTICATION
        </div>
      </div>
    </div>
  );
};
