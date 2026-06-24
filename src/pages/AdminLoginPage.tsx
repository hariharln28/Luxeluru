import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { CaptchaChallenge } from '../components/CaptchaChallenge';
import { useApp } from '../context/AppContext';

export function AdminLoginPage() {
  const { adminLogin, isAdmin } = useApp();
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect
  if (isAdmin) {
    navigate('/admin-dashboard', { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!adminUser || !adminPass) {
      setError('Please enter both username and password.');
      return;
    }
    const success = await adminLogin(adminUser, adminPass);
    if (success) {
      navigate('/admin-dashboard');
    } else {
      setError('Invalid Administrator credentials.');
    }
  }

  return (
    <div className="min-h-screen min-h-dvh flex items-center justify-center px-4 py-12">
      <form onSubmit={handleSubmit} className="luxe-card w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#c9a962]/15 mb-4">
            <Shield className="h-7 w-7 text-[#c9a962]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[#e8d5a3]">Admin Portal</h1>
          <p className="text-xs text-[#9a8fa8] mt-1">Authorized personnel only. All activity is monitored.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs text-[#9a8fa8] font-semibold uppercase tracking-wider">Admin Username</label>
          <div className="mt-1 relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a8fa8]" />
            <input
              type="text"
              value={adminUser}
              onChange={(e) => setAdminUser(e.target.value)}
              className="luxe-input pl-10"
              placeholder="Enter admin username"
              autoComplete="off"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-[#9a8fa8] font-semibold uppercase tracking-wider">Admin Password</label>
          <div className="mt-1 relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9a8fa8]" />
            <input
              type="password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              className="luxe-input pl-10"
              placeholder="••••••••"
              autoComplete="off"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        <CaptchaChallenge onVerified={setCaptchaValid} />

        <button
          type="submit"
          disabled={!captchaValid}
          className="luxe-btn w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Authenticate
        </button>

        <p className="text-[10px] text-center text-[#6b6175]">
          🔒 This portal is not linked from any public page. Access is restricted to authorized administrators.
        </p>
      </form>
    </div>
  );
}
