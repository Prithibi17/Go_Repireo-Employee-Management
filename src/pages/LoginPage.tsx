import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Shield, ScanFace, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { FaceLoginScanner } from '@/components/auth/FaceLoginScanner';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [authMode, setAuthMode] = useState<'face' | 'password'>('face');

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Password Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.success) {
        await refreshUser();
        navigate('/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('An unexpected error occurred during sign-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceLoginSuccess = async () => {
    await refreshUser();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden select-none">
      {/* Subtle background ambient radial */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(120,119,198,0.08),transparent_50%)] pointer-events-none" />

      <div className="w-full max-w-[400px] relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 mb-3 shadow-sm">
            <img
              src="/gorepireo-logo.png"
              alt="Go_Repireo"
              className="w-8 h-8 object-contain"
            />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            Go_Repireo
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Enterprise Identity & Workforce Operations
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#121215] border border-zinc-800/80 rounded-xl p-5 sm:p-6 shadow-2xl backdrop-blur-sm">
          {/* Auth Method Switcher Tabs */}
          <div className="flex p-1 bg-zinc-900/90 rounded-lg border border-zinc-800 mb-5">
            <button
              type="button"
              onClick={() => setAuthMode('face')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                authMode === 'face'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ScanFace className="w-3.5 h-3.5 text-cyan-400" />
              Face ID
            </button>

            <button
              type="button"
              onClick={() => setAuthMode('password')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                authMode === 'password'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              Password
            </button>
          </div>

          {/* Mode 1: Face Biometric Scanner */}
          {authMode === 'face' ? (
            <FaceLoginScanner
              onLoginSuccess={handleFaceLoginSuccess}
              onSwitchToPassword={() => setAuthMode('password')}
            />
          ) : (
            /* Mode 2: Password Authentication */
            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              {error && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium text-zinc-300 mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gorepireo.in"
                    className="w-full pl-9 pr-3 py-2 text-[13px] bg-zinc-900/60 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-medium text-zinc-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-[13px] bg-zinc-900/60 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg text-[13px] font-medium text-zinc-950 bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-white transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {loading ? (
                  'Signing in...'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-zinc-400" />
              Dual-factor biometrics enabled
            </span>
            <span>Go_Repireo</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-600 mt-5">
          Learn • Build • Grow
        </p>
      </div>
    </div>
  );
}

