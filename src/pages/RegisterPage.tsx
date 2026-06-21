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
  const { register, language } = useApp();
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
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
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
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8fa8] hover:text-[#e8d5a3] transition">
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
          <p className="text-center text-sm text-[#9a8fa8]">
            {tr('hasAccount')}{' '}
            <Link to="/login" className="text-[#c9a962] hover:underline">{tr('login')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
