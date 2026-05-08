import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ClientLoginPage = lazy(() => import('./pages/ClientLoginPage').then(m => ({ default: m.ClientLoginPage })));
const ClientPanel = lazy(() => import('./pages/ClientPanel').then(m => ({ default: m.ClientPanel })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const VenteRoutes = lazy(() => import('./routes/VenteRoutes').then(m => ({ default: m.VenteRoutes })));
const AchatRoutes = lazy(() => import('./routes/AchatRoutes').then(m => ({ default: m.AchatRoutes })));
const StockRoutes = lazy(() => import('./routes/StockRoutes').then(m => ({ default: m.StockRoutes })));
const ConsultationRoutes = lazy(() => import('./routes/ConsultationRoutes').then(m => ({ default: m.ConsultationRoutes })));
const ParamRoutes = lazy(() => import('./routes/ParamRoutes').then(m => ({ default: m.ParamRoutes })));
const ClientRoutes = lazy(() => import('./routes/ClientRoutes').then(m => ({ default: m.ClientRoutes })));

import { ErrorBoundary } from './components/ui/ErrorBoundary';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<ErrorBoundary><Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense></ErrorBoundary>} />
            <Route path="/client/login" element={<ErrorBoundary><Suspense fallback={<LoadingFallback />}><ClientLoginPage /></Suspense></ErrorBoundary>} />
            <Route path="/client/panel" element={<ProtectedRoute><ErrorBoundary><Suspense fallback={<LoadingFallback />}><ClientPanel /></Suspense></ErrorBoundary></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><ErrorBoundary><Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense></ErrorBoundary></ProtectedRoute>} />
            <Route
              path="/dashboard/vente/*"
              element={<ProtectedRoute><ErrorBoundary><Suspense fallback={<LoadingFallback />}><VenteRoutes /></Suspense></ErrorBoundary></ProtectedRoute>}
            />
            <Route
              path="/dashboard/achat/*"
              element={<ProtectedRoute><ErrorBoundary><Suspense fallback={<LoadingFallback />}><AchatRoutes /></Suspense></ErrorBoundary></ProtectedRoute>}
            />
            <Route
              path="/dashboard/stock/*"
              element={<ProtectedRoute><ErrorBoundary><Suspense fallback={<LoadingFallback />}><StockRoutes /></Suspense></ErrorBoundary></ProtectedRoute>}
            />
            <Route
              path="/dashboard/cons/*"
              element={<ProtectedRoute><ErrorBoundary><Suspense fallback={<LoadingFallback />}><ConsultationRoutes /></Suspense></ErrorBoundary></ProtectedRoute>}
            />
            <Route
              path="/dashboard/param/*"
              element={<ProtectedRoute><ErrorBoundary><Suspense fallback={<LoadingFallback />}><ParamRoutes /></Suspense></ErrorBoundary></ProtectedRoute>}
            />
            <Route
              path="/client/*"
              element={<ProtectedRoute><ErrorBoundary><Suspense fallback={<LoadingFallback />}><ClientRoutes /></Suspense></ErrorBoundary></ProtectedRoute>}
            />
            <Route path="/" element={<Navigate to="/client/consultation" />} />
          </Routes>
        </Router>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
