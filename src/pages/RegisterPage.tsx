import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import type { Language } from '../types';
import logoUrl from '../assets/logo.png.jpeg';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle, language } = useApp();
  const tr = useT();
  const navigate = useNavigate();

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePhone(phone: string): boolean {
    const digits = phone.replace(/[\s\-\+\(\)]/g, '');
    return digits.length >= 10;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setError(tr('required'));
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!validatePhone(phone.trim())) {
      setError('Please enter a valid phone number (at least 10 digits).');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError(tr('passwordMismatch'));
      return;
    }

    setLoading(true);
    const ok = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      preferredLanguage: language as Language,
    });
    setLoading(false);

    if (!ok) {
      setError('Registration failed. Please check the message above and try again.');
      return;
    }
    navigate('/login', { state: { fromRegister: true, email: email.trim().toLowerCase() } });
  }

  return (
    <div className="flex min-h-[calc(100dvh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <img src={logoUrl} alt="Luxeluru" className="mx-auto h-20 w-auto object-contain mix-blend-screen" />
          <h1 className="mt-4 font-display text-3xl gold-gradient">{tr('register')}</h1>
          <p className="mt-2 text-sm text-[#9a8fa8]">Join Bengaluru&apos;s luxury beauty community</p>
        </div>

        <form onSubmit={handleSubmit} className="luxe-card space-y-4 p-6 sm:p-8">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">{error}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm text-[#9a8fa8]">{tr('name')} <span className="text-red-400">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="luxe-input"
              placeholder="Your full name"
              autoComplete="name"
              autoCapitalize="words"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[#9a8fa8]">{tr('email')} <span className="text-red-400">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="luxe-input"
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[#9a8fa8]">{tr('phone')} <span className="text-red-400">*</span></label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="luxe-input"
              placeholder="+91 98765 43210"
              autoComplete="tel"
              inputMode="tel"
              style={{ fontSize: '16px' }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[#9a8fa8]">{tr('password')} <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="luxe-input pr-10"
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                style={{ fontSize: '16px' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 -m-2 text-[#9a8fa8] hover:text-[#e8d5a3] transition">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[#9a8fa8]">{tr('confirmPassword')} <span className="text-red-400">*</span></label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="luxe-input"
              placeholder="Re-enter password"
              autoComplete="new-password"
              style={{ fontSize: '16px' }}
            />
          </div>
          <button type="submit" disabled={loading} className="luxe-btn w-full disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              tr('register')
            )}
          </button>
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
            Sign up with Google
          </button>
          <p className="text-center text-sm text-[#9a8fa8]">
            {tr('hasAccount')}{' '}
            <Link to="/login" className="text-[#c9a962] hover:underline">{tr('login')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
