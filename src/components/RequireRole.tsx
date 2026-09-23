import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

/**
 * Guards routes that only make sense for one role (e.g. /jobs for artisans, /bookings for
 * customers). Reads the role straight from the authenticated user -- never from a prop, and never
 * from any client-side "preview" state -- so there is no way to view a role-restricted page by
 * manipulating local state or typing the URL directly; role mismatch redirects to /home exactly
 * like RequireAuth redirects a logged-out visit, plus a toast since this one isn't self-explanatory
 * the way "you're not signed in" is.
 */
export const RequireRole: React.FC<{ allow: Role[] }> = ({ allow }) => {
  const { user } = useAuth();
  const role: Role = user?.role === 'artisan' ? 'professional' : 'customer';

  if (!allow.includes(role)) {
    toast.error("You don't have access to that page.");
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};
