import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
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
import { SalonPortalPage } from './pages/SalonPortalPage';

export default function App() {
  return (
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
            <Route path="/salon-portal" element={<ProtectedRoute><SalonPortalPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
