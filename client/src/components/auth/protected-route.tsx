import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setLocation(redirectTo);
      return;
    }

    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
      // User doesn't have the required role, redirect to dashboard
      setLocation('/dashboard');
      return;
    }
  }, [isAuthenticated, user, isLoading, allowedRoles, redirectTo, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}