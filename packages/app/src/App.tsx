import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { useTheme } from './store/themeStore';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PresenterPage from './pages/PresenterPage';
import PresentationManagePage from './pages/PresentationManagePage';
import PresentationPage from './pages/PresentationPage';
import JoinPage from './pages/JoinPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route wrapper component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // Apply dark mode class to html element which Tailwind uses for dark mode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/presenter"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PresenterPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/presenter/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PresentationManagePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/presentation/:id" element={<PresentationPage />} />
        <Route path="/" element={<Navigate to="/join" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App; 