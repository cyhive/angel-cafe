import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  error: string | null;
  busy: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, error, busy }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    void onLogin(username, password);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#10100f] text-white flex items-center justify-center px-5 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,158,11,0.13),transparent_55%)]" />
      <div className="absolute -left-28 bottom-[-10rem] h-96 w-96 rounded-full border border-amber-400/10" />
      <div className="absolute -left-16 bottom-[-9rem] h-72 w-72 rounded-full border border-amber-400/10" />
      <section className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 rounded-2xl border border-white/10 bg-neutral-900 p-1.5 shadow-2xl shadow-black/40">
            <img src="/brand/angel-cafe-logo.png" alt="Angel Cafe" className="h-16 w-16 rounded-xl" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-amber-400">Angel Cafe</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-neutral-400">Sign in to continue to your cafe dashboard.</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-white/[0.09] bg-neutral-900/90 p-6 shadow-2xl shadow-black/40 sm:p-8">
          <label htmlFor="username" className="mb-2 block text-xs font-semibold text-neutral-300">Username</label>
          <div className="mb-5 flex items-center rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 transition-colors focus-within:border-amber-500/70 focus-within:ring-2 focus-within:ring-amber-500/10">
            <UserRound className="mr-3 h-4 w-4 shrink-0 text-neutral-500" />
            <input id="username" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600" />
          </div>

          <label htmlFor="password" className="mb-2 block text-xs font-semibold text-neutral-300">Password</label>
          <div className="flex items-center rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 transition-colors focus-within:border-amber-500/70 focus-within:ring-2 focus-within:ring-amber-500/10">
            <LockKeyhole className="mr-3 h-4 w-4 shrink-0 text-neutral-500" />
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-600" />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="rounded p-1 text-neutral-500 hover:text-neutral-200">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && <p role="alert" className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">{error}</p>}

          <button type="submit" disabled={busy} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-950/30 transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-70">
            {busy ? 'Signing in…' : 'Sign in'}
            {!busy && <ArrowRight className="h-4 w-4" />}
          </button>
          <p className="mt-5 text-center text-[11px] text-neutral-500">Authorized staff only</p>
        </form>
        <p className="mt-6 text-center text-[11px] text-neutral-600">Angel Cafe · Billing &amp; Operations</p>
      </section>
    </main>
  );
};
