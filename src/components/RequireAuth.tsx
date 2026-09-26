import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guards every authenticated route. Redirects to the sign-in page when logged out, preserving
 * the originally-requested URL via location state so sign-in can send the user back to it
 * afterwards instead of always landing on the role home.
 */
export const RequireAuth: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
