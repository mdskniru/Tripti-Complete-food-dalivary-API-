import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LOGIN_PATH, ROLE_HOME } from '../utils/constants';
import PageLoader from './PageLoader';

export default function ProtectedRoute({ role, children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader label="Checking your session…" />;
  }

  if (!currentUser) {
    const loginPath = role ? LOGIN_PATH[role] : '/login';
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  if (role && currentUser.role !== role) {
    return <Navigate to={ROLE_HOME[currentUser.role] || '/'} replace />;
  }

  return children;
}
