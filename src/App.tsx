import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { ProtectedRoute, GuestRoute, SalonRoute, AdminRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SalonsPage } from './pages/SalonsPage';
import { SalonDetailPage } from './pages/SalonDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AIStylistPage } from './pages/AIStylistPage';
import { NavigatorPage } from './pages/NavigatorPage';
import { BookingsPage } from './pages/BookingsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { PartnerWithUsPage } from './pages/PartnerWithUsPage';
import { SalonDashboardPage } from './pages/SalonDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

export default function App() {
  return (
    <ErrorBoundary>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/salons" element={<SalonsPage />} />
            <Route path="/salons/:id" element={<SalonDetailPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />

            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/ai-stylist" element={<ProtectedRoute><AIStylistPage /></ProtectedRoute>} />
            <Route path="/navigator" element={<ProtectedRoute><NavigatorPage /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/partner-with-us" element={<PartnerWithUsPage />} />
            <Route path="/salon-dashboard" element={<SalonRoute><SalonDashboardPage /></SalonRoute>} />
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
    </ErrorBoundary>
  );
}
