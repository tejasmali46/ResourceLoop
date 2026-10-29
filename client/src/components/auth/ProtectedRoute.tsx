import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { UserRole } from '../../types/index.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium tracking-wide">Authenticating session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.isActive === false) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = (user as any)?.roles?.length ? (user as any).roles : [user.role];
    const isAuthorized = allowedRoles.some((role) => userRoles.includes(role)) || userRoles.includes('ADMIN');

    if (!isAuthorized) {
      if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
      if (user.role === 'FACULTY') return <Navigate to="/approvals" replace />;
      if (user.role === 'HOD') return <Navigate to="/hod/dashboard" replace />;
      if (user.role === 'RESOURCE_MANAGER') return <Navigate to="/manager/dashboard" replace />;
      if (user.role === 'ADMIN') return <Navigate to="/admin/analytics" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
