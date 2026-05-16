import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Workspace from './pages/Workspace';
import InsightsPage from './pages/InsightsPage';
import SharedNotePage from './pages/SharedNotePage';
import LandingPage from './pages/LandingPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="page-loader"><div className="spinner" /></div>;
  if (user) return <Navigate to="/notes" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/shared/:shareId" element={<SharedNotePage />} />

      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/notes" element={<Workspace />} />
        <Route path="/notes/:id" element={<Workspace />} />
        <Route path="/insights" element={<InsightsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="bottom-right" toastOptions={{
          style: { background: '#14141e', color: '#f0f0f5', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', fontFamily: 'Inter,sans-serif', fontSize: '0.82rem' },
        }} />
      </AuthProvider>
    </BrowserRouter>
  );
}
