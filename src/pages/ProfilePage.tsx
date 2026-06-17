import { useState } from 'react';
import { User, Globe, Phone, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import type { Language } from '../types';

export function ProfilePage() {
  const { user, updateUserProfile, setLanguage, language } = useApp();
  const tr = useT();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  if (!user) return null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateUserProfile({ name, phone });
  }

  const langs: { code: Language; label: string }[] = [
    { code: 'en', label: tr('english') },
    { code: 'hi', label: tr('hindi') },
    { code: 'kn', label: tr('kannada') },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl gold-gradient">{tr('profile')}</h1>

      <div className="mt-8 luxe-card p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#c9a962]/20">
            <User className="h-8 w-8 text-[#c9a962]" />
          </div>
          <div>
            <p className="font-display text-xl text-[#e8d5a3]">{user.name}</p>
            <p className="text-sm text-[#9a8fa8]">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm text-[#9a8fa8]">
              <User className="h-4 w-4" /> {tr('name')}
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="luxe-input" />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm text-[#9a8fa8]">
              <Mail className="h-4 w-4" /> {tr('email')}
            </label>
            <input value={user.email} disabled className="luxe-input opacity-60" />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm text-[#9a8fa8]">
              <Phone className="h-4 w-4" /> {tr('phone')}
            </label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="luxe-input" />
          </div>
          <button type="submit" className="luxe-btn w-full">{tr('submit')}</button>
        </form>

        <div className="mt-8 border-t border-[#c9a962]/10 pt-6">
          <label className="mb-3 flex items-center gap-2 text-sm text-[#9a8fa8]">
            <Globe className="h-4 w-4" /> {tr('language')}
          </label>
          <div className="flex gap-2">
            {langs.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                className={`flex-1 rounded-lg py-2.5 text-sm transition ${
                  language === code
                    ? 'bg-[#c9a962] font-semibold text-[#0f0d12]'
                    : 'border border-[#c9a962]/30 text-[#e8d5a3] hover:border-[#c9a962]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
