import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { LogIn, AlertCircle, Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const isExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both your email and password.');
      return;
    }

    try {
      setSubmitting(true);
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.error?.message ||
        (!err.response
          ? 'Cannot reach ClearDoc server. Please ensure the backend is running.'
          : 'Unable to log in. Please check your credentials and try again.');
      setError(serverMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const labelClass = 'block text-xs font-bold uppercase tracking-[0.16em] text-deep-teal/70 mb-2';

  return (
    <div className="grid min-h-[calc(100vh-4.5rem)] lg:grid-cols-12 bg-surface">
      {/* Statement panel */}
      <aside className="hidden bg-deep-teal px-10 py-16 text-white lg:col-span-5 lg:flex lg:flex-col lg:justify-between lg:border-r lg:border-white/10 lg:px-12 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 10% 15%, rgba(15,164,175,0.18), transparent 50%), radial-gradient(circle at 90% 85%, rgba(150,71,52,0.12), transparent 50%)',
          }}
        />
        <div className="relative z-10">
          <Logo inverted={true} />
        </div>

        <div className="relative z-10">
          <p className="text-[clamp(2rem,2.8vw,3.25rem)] font-extrabold leading-[1.08] tracking-tight">
            Complex documents.
            <br />
            <span className="text-bright-cyan">Clear understanding.</span>
          </p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/75">
            Sign in to access your plain-language summaries, verified deadlines, action steps and
            audio read-aloud narration.
          </p>

          <div className="mt-8 flex items-center gap-2.5 text-xs text-white/70">
            <ShieldCheck className="h-4 w-4 text-bright-cyan shrink-0" />
            <span>100% In-memory privacy — isolated to your account</span>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          ClearDoc Accessible AI Workspace · Version 1
        </p>
      </aside>

      {/* Form area */}
      <div className="flex items-center justify-center px-5 py-14 sm:px-8 lg:col-span-7">
        <div className="w-full max-w-md">
          <div className="mb-2 inline-flex items-center gap-2 rounded-sm bg-bright-cyan/10 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-bright-cyan border border-bright-cyan/20">
            <span className="h-1.5 w-1.5 rounded-full bg-bright-cyan" />
            <span>Account Access</span>
          </div>

          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-deep-teal">
            Welcome back.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-deep-teal/70 sm:text-base">
            Access your document workspace and personalized analyses.
          </p>

          {isExpired && (
            <div
              className="mt-6 flex items-center gap-3 border-l-4 border-terracotta bg-terracotta/10 px-4 py-3 text-sm text-deep-teal rounded-sm"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-terracotta" aria-hidden="true" />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div
              className="mt-6 flex items-center gap-3 border-l-4 border-terracotta bg-terracotta/10 px-4 py-3 text-sm text-deep-teal rounded-sm"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-terracotta" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="login-email" className={labelClass}>
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-teal/40"
                  aria-hidden="true"
                />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="field pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className={labelClass}>
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-teal/40"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-deep-teal/50 hover:text-deep-teal transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full py-3.5 text-base font-bold shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in…</span>
                </span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-8 border-t border-deep-teal/10 pt-6 text-sm text-deep-teal/70">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-deep-teal underline decoration-bright-cyan decoration-2 underline-offset-4 hover:text-bright-cyan transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
