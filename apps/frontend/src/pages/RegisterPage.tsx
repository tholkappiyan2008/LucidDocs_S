import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { UserPlus, AlertCircle, Lock, Mail, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await register({ name, email, password });
      navigate('/dashboard');
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        (!err.response
          ? 'Cannot reach ClearDoc server. Please ensure the backend is running.'
          : 'Unable to complete registration. Please check your details and try again.');
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
              'radial-gradient(circle at 15% 20%, rgba(15,164,175,0.20), transparent 50%), radial-gradient(circle at 85% 80%, rgba(150,71,52,0.14), transparent 50%)',
          }}
        />
        <div className="relative z-10">
          <Logo inverted={true} />
        </div>

        <div className="relative z-10">
          <p className="text-[clamp(2rem,2.8vw,3.25rem)] font-extrabold leading-[1.08] tracking-tight">
            Documents Shouldn&apos;t
            <br />
            <span className="text-bright-cyan">Be Difficult.</span>
          </p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/75">
            Create an account to analyze utility bills, hospital records, and official notices with
            clear summaries, risk alerts, and speech synthesis.
          </p>

          <ul className="mt-8 space-y-3 text-xs text-white/70">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-bright-cyan shrink-0" />
              <span>PDF, PNG or JPEG document extraction up to 10MB</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-bright-cyan shrink-0" />
              <span>Strict multi-user ownership isolation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-bright-cyan shrink-0" />
              <span>Full control to permanently delete any document</span>
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          In-memory processing · Enterprise security standards
        </p>
      </aside>

      {/* Form area */}
      <div className="flex items-center justify-center px-5 py-14 sm:px-8 lg:col-span-7">
        <div className="w-full max-w-md">
          <div className="mb-2 inline-flex items-center gap-2 rounded-sm bg-bright-cyan/10 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-bright-cyan border border-bright-cyan/20">
            <span className="h-1.5 w-1.5 rounded-full bg-bright-cyan" />
            <span>New Account</span>
          </div>

          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-deep-teal">
            Start understanding.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-deep-teal/70 sm:text-base">
            Join ClearDoc to make everyday documents accessible and clear.
          </p>

          {error && (
            <div
              className="mt-6 flex items-center gap-3 border-l-4 border-terracotta bg-terracotta/10 px-4 py-3 text-sm text-deep-teal rounded-sm"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-terracotta" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="register-name" className={labelClass}>
                Full name
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-teal/40"
                  aria-hidden="true"
                />
                <input
                  id="register-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="field pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className={labelClass}>
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-teal/40"
                  aria-hidden="true"
                />
                <input
                  id="register-email"
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
              <label htmlFor="register-password" className={labelClass}>
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-teal/40"
                  aria-hidden="true"
                />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
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

            <div>
              <label htmlFor="register-confirm" className={labelClass}>
                Confirm password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-deep-teal/40"
                  aria-hidden="true"
                />
                <input
                  id="register-confirm"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="field pl-10 pr-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full py-3.5 text-base font-bold shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 mt-2"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating account…</span>
                </span>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-8 border-t border-deep-teal/10 pt-6 text-sm text-deep-teal/70">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-deep-teal underline decoration-bright-cyan decoration-2 underline-offset-4 hover:text-bright-cyan transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
