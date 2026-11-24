import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User as UserIcon, Scissors, Mail, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import logoUrl from '../assets/logo.png.jpeg';

export function LoginPage() {
  const [loginType, setLoginType] = useState<'user' | 'salon'>('user');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  
  // User states
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Salon states
  const [salonName, setSalonName] = useState('');
  const [salonId, setSalonId] = useState('');
  const [salonEmail, setSalonEmail] = useState('');
  const [salonPassword, setSalonPassword] = useState('');
  const [showSalonPass, setShowSalonPass] = useState(false);

  const [error, setError] = useState('');
  const { login, salonLogin, resetPassword } = useApp();
  const tr = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = (location.state as { fromRegister?: boolean } | null)?.fromRegister ?? false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (loginType === 'user') {
      if (!emailOrPhone || !password) {
        setError(tr('required'));
        return;
      }
      const success = await login(emailOrPhone, password);
      if (!success) {
        setError(tr('invalidCredentials'));
        return;
      }
      navigate('/dashboard');
    } else {
      if (!salonName.trim() || !salonId.trim() || !salonEmail.trim() || !salonPassword) {
        setError('All fields are required for salon login.');
        return;
      }
      const success = await salonLogin(salonName, salonId, salonEmail, salonPassword);
      if (!success) {
        setError('Invalid salon login details. Verify name, ID, email, password and approval status.');
        return;
      }
      navigate('/salon-dashboard');
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setResetSending(true);
    const success = await resetPassword(resetEmail.trim());
    setResetSending(false);
    if (success) {
      setResetSent(true);
    }
  }

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 text-center">
            <img src={logoUrl} alt="Luxeluru" className="mx-auto h-20 w-auto object-contain mix-blend-screen" />
            <h1 className="mt-4 font-display text-3xl gold-gradient">Reset Password</h1>
            <p className="mt-2 text-sm text-[#9a8fa8]">
              {resetSent
                ? "We've sent you a password reset link"
                : "Enter your email and we'll send you a reset link"}
            </p>
          </div>

          <div className="luxe-card p-6 sm:p-8">
            {resetSent ? (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                  <Mail className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400 text-center">
                  <p className="font-medium">Check your email!</p>
                  <p className="mt-1 text-emerald-400/80">
                    We've sent a password reset link to <strong>{resetEmail}</strong>.
                    Click the link in the email to set a new password.
                  </p>
                </div>
                <p className="text-xs text-center text-[#9a8fa8]">
                  Didn't receive it? Check your spam folder or try again.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setResetSent(false); setResetEmail(''); }}
                    className="luxe-btn-outline flex-1 text-sm"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setResetSent(false); setResetEmail(''); setError(''); }}
                    className="luxe-btn flex-1 text-sm"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
                )}
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
                <button
                  type="submit"
                  disabled={resetSending}
                  className="luxe-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetSending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0f0d12] border-t-transparent" />
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(false); setError(''); }}
                  className="flex w-full items-center justify-center gap-2 text-sm text-[#9a8fa8] hover:text-[#c9a962] transition"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Login View
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
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
              <span>✓</span>
              <span>Account created successfully! Please sign in to continue.</span>
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
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
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm text-[#9a8fa8]">{tr('password')}</label>
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setError(''); setResetEmail(emailOrPhone.includes('@') ? emailOrPhone : ''); }}
                    className="text-xs text-[#c9a962] hover:underline transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="luxe-input pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8fa8]"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8fa8]"
                  >
                    {showSalonPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="luxe-btn w-full">
            {loginType === 'user' ? tr('login') : 'Sign In as Salon'}
          </button>

          {loginType === 'user' && (
            <p className="text-center text-sm text-[#9a8fa8]">
              {tr('noAccount')}{' '}
              <Link to="/register" className="text-[#c9a962] hover:underline">{tr('register')}</Link>
            </p>
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
    </div>
  );
}
