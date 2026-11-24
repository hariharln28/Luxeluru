import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { ReactNode } from 'react';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user } = useApp();
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
