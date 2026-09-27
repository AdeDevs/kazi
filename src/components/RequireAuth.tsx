import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guards every authenticated route. Redirects to the sign-in page when logged out, preserving
 * the originally-requested URL via location state so sign-in can send the user back to it
 * afterwards instead of always landing on the role home.
 */
// Set just before a deliberate sign-out. Clearing the user re-renders this guard (more than once,
// under StrictMode) before the sign-out's own navigation settles, and without this it would send
// the person to sign-in rather than the landing page. It clears itself shortly after, so a later
// logged-out visit to a protected link still goes to sign-in.
let signingOut = false;
let signingOutTimer: ReturnType<typeof setTimeout> | undefined;
export function markSigningOut() {
  signingOut = true;
  clearTimeout(signingOutTimer);
  signingOutTimer = setTimeout(() => { signingOut = false; }, 1500);
}

export const RequireAuth: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    if (signingOut) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
