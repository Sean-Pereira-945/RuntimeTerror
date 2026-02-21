import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ParticleBackground from '../components/ParticleBackground';
import LoadingSpinner from '../components/LoadingSpinner';

type Mode = 'login' | 'register';
type Role = 'client' | 'admin';

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [activeTab, setActiveTab] = useState<Role>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const { login, register, user, isLoading, error } = useAuth();
  const navigate = useNavigate();

  // Redirect when login completes
  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/client', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setFormError('Name is required');
          return;
        }
        await register(name, email, password, activeTab, org);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setFormError(msg);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden">
      <ParticleBackground />

      {/* Ambient blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-pink-600/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md mx-4 animate-scale-in">
        {/* Back link */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm dark:text-slate-400 text-slate-500 hover:text-violet-400 transition-colors mb-8 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>

        {/* Card */}
        <div className="rounded-3xl glass-strong p-8 sm:p-10 shadow-2xl shadow-violet-500/5">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30">
              FL
            </div>
            <div>
              <div className="font-bold dark:text-white text-slate-900">FedLearn</div>
            </div>
          </div>

          {/* Login / Register toggle */}
          <div className="flex rounded-xl p-1 bg-white/5 mb-6">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setFormError(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  mode === m
                    ? 'bg-white/10 text-white'
                    : 'dark:text-slate-400 text-slate-500 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Role tabs (only for register) */}
          {mode === 'register' && (
            <div className="flex rounded-xl p-1 bg-white/5 mb-6">
              {(['client', 'admin'] as Role[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveTab(role)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    activeTab === role
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/25'
                      : 'dark:text-slate-400 text-slate-500 hover:text-white'
                  }`}
                >
                  {role === 'client' ? 'Client' : 'Admin'}
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {(formError || error) && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-center text-red-400">{formError || error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Sarah Chen"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 dark:text-white text-slate-900 text-sm focus:border-violet-500 transition-colors placeholder:text-slate-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">Organization</label>
                  <input
                    type="text"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    placeholder="Hospital A — Metro General"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 dark:text-white text-slate-900 text-sm focus:border-violet-500 transition-colors placeholder:text-slate-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 dark:text-white text-slate-900 text-sm focus:border-violet-500 transition-colors placeholder:text-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 dark:text-white text-slate-900 text-sm focus:border-violet-500 transition-colors placeholder:text-slate-500"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full py-3.5 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-pink-600" />
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <LoadingSpinner text="" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : `Register as ${activeTab === 'client' ? 'Client' : 'Admin'}`}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Toggle hint */}
          <p className="mt-5 text-xs text-center dark:text-slate-500 text-slate-400">
            {mode === 'login' ? (
              <>Don&apos;t have an account?{' '}<button onClick={() => { setMode('register'); setFormError(null); }} className="text-violet-400 hover:underline">Register</button></>
            ) : (
              <>Already have an account?{' '}<button onClick={() => { setMode('login'); setFormError(null); }} className="text-violet-400 hover:underline">Sign In</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
