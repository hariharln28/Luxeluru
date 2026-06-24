import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center animate-fade-in">
      <p className="font-display text-[120px] leading-none gold-gradient font-bold select-none">404</p>
      <h1 className="font-display text-2xl text-[#e8d5a3] mt-2">Page Not Found</h1>
      <p className="text-sm text-[#9a8fa8] mt-3 max-w-sm">
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>
      <div className="flex flex-wrap gap-3 mt-8 justify-center">
        <Link to="/" className="luxe-btn flex items-center gap-2" style={{ touchAction: 'manipulation' }}>
          <Home className="h-4 w-4" /> Go Home
        </Link>
        <button onClick={() => window.history.back()} className="luxe-btn-outline flex items-center gap-2" style={{ touchAction: 'manipulation' }}>
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>
    </div>
  );
}
