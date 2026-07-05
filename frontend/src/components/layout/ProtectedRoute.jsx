import { Navigate, Outlet } from 'react-router-dom';
import { tokenStore } from '../../lib/apiClient.js';
import { useCurrentUser } from '../../hooks/useAuth.js';
import { Spinner } from '../common/Spinner.jsx';

// Gate all app pages — unauthenticated users are redirected to /login.
export const ProtectedRoute = () => {
  const hasToken = Boolean(tokenStore.get());
  const { isLoading, isError } = useCurrentUser();

  if (!hasToken) return <Navigate to="/login" replace />;
  if (isLoading) return <Spinner label="Restoring your session…" />;
  if (isError) {
    tokenStore.clear();
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
