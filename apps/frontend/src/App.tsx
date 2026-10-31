import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { A11yProvider } from './context/A11yContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SmoothScroll } from './components/SmoothScroll';
import { ProtectedRoute } from './components/ProtectedRoute';
import { scrollToTop } from './lib/scroll';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { HistoryPage } from './pages/HistoryPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';

const AppRoutes: React.FC = () => {
  const location = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => {
    scrollToTop();
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={location.pathname}
        id="main-content"
        className="flex-1 w-full max-w-full overflow-x-hidden"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduce ? undefined : { opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <Routes location={location}>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents/:id"
            element={
              <ProtectedRoute>
                <DocumentDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.main>
    </AnimatePresence>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <SmoothScroll>
        <A11yProvider>
          <AuthProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-bright-cyan focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-deep-teal focus:shadow-md focus:rounded-sm"
            >
              Skip to main content
            </a>
            <div className="flex min-h-screen flex-col bg-surface text-deep-teal w-full max-w-full overflow-x-hidden">
              <Navbar />
              <AppRoutes />
              <Footer />
            </div>
          </AuthProvider>
        </A11yProvider>
      </SmoothScroll>
    </BrowserRouter>
  );
};

export default App;
