import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User as UserIcon, Scissors, Loader2, Mail, KeyRound, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import logoUrl from '../assets/logo.png.jpeg';

export function LoginPage() {
  const [loginType, setLoginType] = useState<'user' | 'salon'>('user');
  
  // User states
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Salon states
  const [salonName, setSalonName] = useState('');
  const [salonId, setSalonId] = useState('');
  const [salonEmail, setSalonEmail] = useState('');
  const [salonPassword, setSalonPassword] = useState('');
  const [showSalonPass, setShowSalonPass] = useState(false);
  const [salonFailedAttempts, setSalonFailedAttempts] = useState(0);

  const [error, setError] = useState('');
  const { login, loginWithGoogle, resetPassword, salonLogin } = useApp();

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    const ok = await resetPassword(resetEmail.trim());
    setResetLoading(false);
    if (ok) setResetSent(true);
  }
  const tr = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { fromRegister?: boolean; email?: string } | null;
  const justRegistered = locationState?.fromRegister ?? false;

  // Pre-fill email from register page
  useState(() => {
    if (locationState?.email) {
      setEmailOrPhone(locationState.email);
    }
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (loginType === 'user') {
      if (!emailOrPhone.trim() || !password) {
        setError(tr('required'));
        return;
      }
      setLoading(true);
      const success = await login(emailOrPhone.trim(), password);
      setLoading(false);
      if (!success) {
        // The specific error is already shown as a toast by the login function
        return;
      }
      navigate('/dashboard');
    } else {
      if (!salonName.trim() || !salonId.trim() || !salonEmail.trim() || !salonPassword) {
        setError('All fields are required for salon login.');
        return;
      }
      setLoading(true);
      const success = await salonLogin(salonName, salonId, salonEmail, salonPassword);
      setLoading(false);
      if (!success) {
        const newCount = salonFailedAttempts + 1;
        setSalonFailedAttempts(newCount);
        if (newCount >= 5) {
          setError('Account may be locked. Please wait 30 minutes before trying again.');
        } else if (newCount >= 3) {
          setError(`Invalid credentials. ${5 - newCount} attempt${5 - newCount > 1 ? 's' : ''} remaining before lockout.`);
        } else {
          setError('Invalid salon login details. Verify name, ID, email, password and approval status.');
        }
        return;
      }
      setSalonFailedAttempts(0);
      navigate('/salon-dashboard');
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <img src={logoUrl} alt="Luxeluru" className="mx-auto h-20 w-auto object-contain mix-blend-screen" />
          <h1 className="mt-4 font-display text-3xl gold-gradient">{tr('login')}</h1>
          <p className="mt-2 text-sm text-[#9a8fa8]">{tr('tagline')}</p>
        </div>

        <div className="mb-6 flex rounded-xl border border-[#c9a962]/20 bg-[#1a1520] p-1">
          <button
            type="button"
            onClick={() => { setLoginType('user'); setError(''); }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
              loginType === 'user' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
            }`}
          >
            <UserIcon className="h-4 w-4" />
            User Login
          </button>
          <button
            type="button"
            onClick={() => { setLoginType('salon'); setError(''); }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
              loginType === 'salon' ? 'bg-[#c9a962] text-[#0f0d12]' : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
            }`}
          >
            <Scissors className="h-4 w-4" />
            Salon Partner Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="luxe-card space-y-4 p-6 sm:p-8">
          {justRegistered && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
              <div className="flex items-center gap-2 font-medium">
                <Mail className="h-4 w-4" />
                Account created successfully!
              </div>
              <p className="mt-1 text-emerald-400/80 text-xs">
                Please check your email inbox and click the verification link, then sign in below.
                Don&apos;t forget to check your spam folder.
              </p>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">{error}</div>
          )}

          {loginType === 'user' ? (
            <>
              <div>
                <label className="mb-1.5 block text-sm text-[#9a8fa8]">Email or Phone Number</label>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="luxe-input"
                  placeholder="you@example.com or +91 98765 43210"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[#9a8fa8]">{tr('password')}</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="luxe-input pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8fa8] hover:text-[#e8d5a3] transition"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => { setForgotOpen(true); setResetEmail(emailOrPhone.includes('@') ? emailOrPhone : ''); setResetSent(false); }}
                    className="text-xs text-[#c9a962] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-sm text-[#9a8fa8]">Salon Name</label>
                <input
                  type="text"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  className="luxe-input"
                  placeholder="e.g. Anura House of Beauty"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[#9a8fa8]">Salon ID</label>
                <input
                  type="text"
                  value={salonId}
                  onChange={(e) => setSalonId(e.target.value)}
                  className="luxe-input"
                  placeholder="e.g. LLANU569"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[#9a8fa8]">Registered Salon Email</label>
                <input
                  type="email"
                  value={salonEmail}
                  onChange={(e) => setSalonEmail(e.target.value)}
                  className="luxe-input"
                  placeholder="hello@anurahouseofbeauty.in"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-[#9a8fa8]">Password</label>
                <div className="relative">
                  <input
                    type={showSalonPass ? 'text' : 'password'}
                    value={salonPassword}
                    onChange={(e) => setSalonPassword(e.target.value)}
                    className="luxe-input pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSalonPass(!showSalonPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8fa8] hover:text-[#e8d5a3] transition"
                  >
                    {showSalonPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Failed attempts warning banner */}
          {loginType === 'salon' && salonFailedAttempts >= 3 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                <strong>Security Warning:</strong> {5 - salonFailedAttempts > 0
                  ? `${5 - salonFailedAttempts} attempt${5 - salonFailedAttempts > 1 ? 's' : ''} remaining before your account is locked for 30 minutes.`
                  : 'Account locked. Please wait 30 minutes.'}
              </span>
            </div>
          )}

          <button type="submit" disabled={loading} className="luxe-btn w-full disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              loginType === 'user' ? tr('login') : 'Sign In as Salon'
            )}
          </button>

          {loginType === 'user' && (
            <>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#c9a962]/15" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#1a1520] px-3 text-[#9a8fa8]">or</span>
                </div>
              </div>
              <button
                type="button"
                onClick={loginWithGoogle}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#c9a962]/20 bg-[#1a1520] px-4 py-2.5 text-sm font-medium text-[#e8d5a3] transition hover:bg-[#c9a962]/10 hover:border-[#c9a962]/40"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
              <p className="text-center text-sm text-[#9a8fa8]">
                {tr('noAccount')}{' '}
                <Link to="/register" className="text-[#c9a962] hover:underline">{tr('register')}</Link>
              </p>
            </>
          )}
        </form>

        <div className="mt-8 luxe-card p-4 text-center">
          <p className="text-sm text-[#9a8fa8]">Grow your business with Luxeluru?</p>
          <Link
            to="/partner-with-us"
            className="mt-2 inline-block text-sm font-semibold text-[#c9a962] hover:underline"
          >
            Partner with Us — Register or Exit Platform
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md animate-fade-in luxe-card p-6 sm:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#c9a962]/10 mx-auto">
              <KeyRound className="h-6 w-6 text-[#c9a962]" />
            </div>
            {resetSent ? (
              <>
                <h3 className="text-center font-display text-xl text-[#e8d5a3]">Check Your Email</h3>
                <p className="mt-3 text-center text-sm text-[#9a8fa8]">
                  We&apos;ve sent a password reset link to <strong className="text-[#c9a962]">{resetEmail}</strong>. 
                  Please check your inbox and spam folder.
                </p>
                <button
                  onClick={() => { setForgotOpen(false); setResetSent(false); }}
                  className="luxe-btn w-full mt-6"
                >
                  Back to Sign In
                </button>
              </>
            ) : (
              <>
                <h3 className="text-center font-display text-xl text-[#e8d5a3]">Reset Password</h3>
                <p className="mt-2 text-center text-sm text-[#9a8fa8]">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
                <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm text-[#9a8fa8]">Email Address</label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="luxe-input"
                      placeholder="you@example.com"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setForgotOpen(false)}
                      className="flex-1 rounded-lg border border-[#c9a962]/20 bg-[#1a1520] px-4 py-2.5 text-sm font-medium text-[#e8d5a3] transition hover:bg-[#c9a962]/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!resetEmail.trim() || resetLoading}
                      className="luxe-btn flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resetLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                        </span>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
