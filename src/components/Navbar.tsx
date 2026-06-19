import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Scissors, Sparkles, MapPin, Calendar,
  Trophy, LogOut, Menu, X, Globe, ChevronDown,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../hooks/useT';
import type { Language } from '../types';
import logoUrl from '../assets/logo.png.jpeg';

export function Navbar() {
  const { user, salon, isAdmin, logout, language, setLanguage } = useApp();
  const tr = useT();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isPartnerAdmin = location.pathname === '/partner-with-us' && queryParams.get('tab') === 'admin';
  const hideLanguageChoice = isAdmin || isPartnerAdmin;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const welcomeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (welcomeRef.current && !welcomeRef.current.contains(e.target as Node)) {
        setWelcomeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navLinks = isAdmin
    ? [{ to: '/admin-dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' }]
    : salon
    ? [{ to: '/salon-dashboard', icon: LayoutDashboard, label: 'Salon Dashboard' }]
    : user
    ? [
        { to: '/dashboard', icon: LayoutDashboard, label: tr('dashboard') },
        { to: '/salons', icon: Scissors, label: tr('salons') },
        { to: '/categories', icon: Sparkles, label: tr('categories') },
        { to: '/ai-stylist', icon: Sparkles, label: tr('aiStylist') },
        { to: '/navigator', icon: MapPin, label: tr('navigator') },
        { to: '/bookings', icon: Calendar, label: tr('bookings') },
        { to: '/leaderboard', icon: Trophy, label: tr('leaderboard') },
      ]
    : [];

  const langs: { code: Language; label: string }[] = [
    { code: 'en', label: tr('english') },
    { code: 'hi', label: tr('hindi') },
    { code: 'kn', label: tr('kannada') },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[#c9a962]/10 bg-[#0f0d12]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to={isAdmin ? '/admin-dashboard' : salon ? '/salon-dashboard' : user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <img src={logoUrl} alt="Luxeluru" className="h-10 w-auto object-contain mix-blend-screen" />
          </Link>

          <div className="hidden items-center gap-4 lg:flex">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-sm transition ${
                  location.pathname === to
                    ? 'text-[#c9a962]'
                    : 'text-[#9a8fa8] hover:text-[#e8d5a3]'
                }`}
              >
                {label}
              </Link>
            ))}

            {!hideLanguageChoice && (
              <div className="relative">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1 text-sm text-[#9a8fa8] hover:text-[#e8d5a3]"
                >
                  <Globe className="h-4 w-4" />
                  {langs.find((l) => l.code === language)?.label}
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-full mt-2 min-w-[120px] rounded-lg border border-[#c9a962]/20 bg-[#1a1520] py-1 shadow-xl">
                    {langs.map(({ code, label }) => (
                      <button
                        key={code}
                        onClick={() => { setLanguage(code); setLangOpen(false); }}
                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-[#c9a962]/10 ${
                          language === code ? 'text-[#c9a962]' : 'text-[#f5f0eb]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isAdmin ? (
              <div className="relative" ref={welcomeRef}>
                <button
                  onClick={() => setWelcomeOpen(!welcomeOpen)}
                  className="flex items-center gap-2 rounded-full border border-red-500/30 bg-[#1a1520] px-4 py-2 text-sm transition hover:border-red-500/60"
                >
                  <span className="text-red-400 font-semibold">Admin Panel</span>
                  <ChevronDown className={`h-4 w-4 text-red-400 transition ${welcomeOpen ? 'rotate-180' : ''}`} />
                </button>
                {welcomeOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[#c9a962]/20 bg-[#1a1520] py-2 shadow-2xl animate-fade-in">
                    <div className="border-b border-[#c9a962]/10 px-4 py-3">
                      <p className="font-display text-lg text-[#c9a962]">ADMINLLURU</p>
                      <p className="text-xs text-[#9a8fa8]">Platform Administrator</p>
                    </div>
                    <Link to="/admin-dashboard" onClick={() => setWelcomeOpen(false)} className="block px-4 py-2 text-sm hover:bg-[#c9a962]/10">Admin Dashboard</Link>
                    <button onClick={() => { logout(); setWelcomeOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">
                      <LogOut className="h-4 w-4" /> {tr('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : salon ? (
              <div className="relative" ref={welcomeRef}>
                <button
                  onClick={() => setWelcomeOpen(!welcomeOpen)}
                  className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-[#1a1520] px-4 py-2 text-sm transition hover:border-amber-500/60"
                >
                  <span className="text-amber-400 font-semibold">{salon.name}</span>
                  <ChevronDown className={`h-4 w-4 text-amber-400 transition ${welcomeOpen ? 'rotate-180' : ''}`} />
                </button>
                {welcomeOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[#c9a962]/20 bg-[#1a1520] py-2 shadow-2xl animate-fade-in">
                    <div className="border-b border-[#c9a962]/10 px-4 py-3">
                      <p className="font-display text-base text-[#c9a962] truncate">{salon.name}</p>
                      <p className="text-xs text-[#9a8fa8] font-mono">ID: {salon.id}</p>
                    </div>
                    <Link to="/salon-dashboard" onClick={() => setWelcomeOpen(false)} className="block px-4 py-2 text-sm hover:bg-[#c9a962]/10">Salon Dashboard</Link>
                    <button onClick={() => { logout(); setWelcomeOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">
                      <LogOut className="h-4 w-4" /> {tr('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : user ? (
              <div className="relative" ref={welcomeRef}>
                <button
                  onClick={() => setWelcomeOpen(!welcomeOpen)}
                  className="flex items-center gap-2 rounded-full border border-[#c9a962]/30 bg-[#1a1520] px-4 py-2 text-sm transition hover:border-[#c9a962]/60"
                >
                  <span className="text-[#e8d5a3]">
                    {tr('welcomeBack')}, <span className="font-semibold text-[#c9a962]">{tr('bengalurian')}</span>!
                  </span>
                  <ChevronDown className={`h-4 w-4 text-[#c9a962] transition ${welcomeOpen ? 'rotate-180' : ''}`} />
                </button>
                {welcomeOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[#c9a962]/20 bg-[#1a1520] py-2 shadow-2xl animate-fade-in">
                    <div className="border-b border-[#c9a962]/10 px-4 py-3">
                      <p className="font-display text-lg text-[#c9a962]">{user.name.split(' ')[0]}</p>
                      <p className="text-xs text-[#9a8fa8]">{user.email}</p>
                    </div>
                    <Link to="/bookings" onClick={() => setWelcomeOpen(false)} className="block px-4 py-2 text-sm hover:bg-[#c9a962]/10">{tr('bookings')}</Link>
                    <Link to="/profile" onClick={() => setWelcomeOpen(false)} className="block px-4 py-2 text-sm hover:bg-[#c9a962]/10">{tr('profile')}</Link>
                    <button onClick={() => { logout(); setWelcomeOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">
                      <LogOut className="h-4 w-4" /> {tr('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="luxe-btn-outline text-sm py-2 px-4">{tr('login')}</Link>
                <Link to="/register" className="luxe-btn text-sm py-2 px-4">{tr('register')}</Link>
              </div>
            )}
          </div>

          <button className="lg:hidden text-[#c9a962]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-[#c9a962]/10 bg-[#1a1520] px-4 py-4 lg:hidden animate-fade-in">
            {isAdmin ? (
              <p className="mb-3 font-display text-lg text-red-400">Admin Control Center</p>
            ) : salon ? (
              <p className="mb-3 font-display text-lg text-amber-400">{salon.name}</p>
            ) : user ? (
              <p className="mb-3 font-display text-lg text-[#c9a962]">
                {tr('welcomeBack')}, {tr('bengalurian')}! — {user.name}
              </p>
            ) : null}
            
            {navLinks.map(({ to, icon: Icon, label }) => (
              <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 py-3 text-[#f5f0eb] border-b border-[#c9a962]/5">
                <Icon className="h-5 w-5 text-[#c9a962]" /> {label}
              </Link>
            ))}
            {!hideLanguageChoice && (
              <div className="mt-4 flex gap-2">
                {langs.map(({ code, label }) => (
                  <button key={code} onClick={() => setLanguage(code)}
                    className={`rounded-lg px-3 py-1.5 text-sm ${language === code ? 'bg-[#c9a962] text-[#0f0d12]' : 'border border-[#c9a962]/30'}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            {isAdmin || salon || user ? (
              <button onClick={() => { logout(); setMobileOpen(false); }} className="mt-4 flex items-center gap-2 text-red-400">
                <LogOut className="h-4 w-4" /> {tr('logout')}
              </button>
            ) : (
              <div className="mt-4 flex gap-2">
                <Link to="/login" className="luxe-btn-outline flex-1 text-center" onClick={() => setMobileOpen(false)}>{tr('login')}</Link>
                <Link to="/register" className="luxe-btn flex-1 text-center" onClick={() => setMobileOpen(false)}>{tr('register')}</Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
