import { useSelector } from 'react-redux';
import { useLocation, Navigate } from 'react-router-dom';

export function RequireAuth({
  children
}: any) {
  const location = useLocation();
  const route = useSelector((state: any) => state.session.route);
  if (route !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
