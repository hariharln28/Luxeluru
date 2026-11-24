import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const { login } = useApp();
  const tr = useT();
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(tr('required'));
      return;
    }
    if (!login(email, password)) {
      setError(tr('invalidCredentials'));
      return;
    }
    navigate('/dashboard');
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-[#c9a962]" />
          <h1 className="mt-4 font-display text-3xl gold-gradient">{tr('login')}</h1>
          <p className="mt-2 text-sm text-[#9a8fa8]">{tr('tagline')}</p>
        </div>

        <form onSubmit={handleSubmit} className="luxe-card space-y-4 p-6 sm:p-8">
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm text-[#9a8fa8]">{tr('email')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="luxe-input" placeholder="you@example.com" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-[#9a8fa8]">{tr('password')}</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)} className="luxe-input pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a8fa8]">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" className="luxe-btn w-full">{tr('login')}</button>
          <p className="text-center text-sm text-[#9a8fa8]">
            {tr('noAccount')}{' '}
            <Link to="/register" className="text-[#c9a962] hover:underline">{tr('register')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
