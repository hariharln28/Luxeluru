import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { ToastContainer } from './ToastContainer';

export function Layout() {
  return (
    <div className="min-h-screen bg-[#0f0d12]">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <ToastContainer />
      <footer className="border-t border-[#c9a962]/10 py-8 text-center text-sm text-[#9a8fa8]">
        <p className="font-display text-lg gold-gradient">Luxeluru</p>
        <p className="mt-1">Bengaluru&apos;s Premier Luxury Salon Experience © 2026</p>
      </footer>
    </div>
  );
}
