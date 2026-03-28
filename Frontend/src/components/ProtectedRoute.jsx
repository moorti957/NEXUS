import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../socket/context/SocketContext';
import { useState, useEffect } from 'react';

/**
 * Protected Route Component
 * Ensures user is authenticated before accessing protected pages
 * Handles loading states, redirects, and permission-based access
 */
export default function ProtectedRoute({ 
  children, 
  requiredRole = null, // 'admin', 'moderator', or null for any authenticated user
  redirectTo = '/auth',
  fallback = null
}) {
  const { user, loading: authLoading } = useAuth();
  const { isConnected, connectionError } = useSocket?.() || {};
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Check authentication and permissions
  useEffect(() => {
    const checkAccess = async () => {
      // Wait for auth to load
      if (authLoading) {
        return;
      }

      // Not authenticated
      if (!user) {
        setHasAccess(false);
        setChecking(false);
        return;
      }

      // Check role requirement
      if (requiredRole) {
        // Admin has access to everything
        if (user.role === 'admin') {
          setHasAccess(true);
          setChecking(false);
          return;
        }

        // Check specific role
        if (user.role === requiredRole) {
          setHasAccess(true);
          setChecking(false);
          return;
        }

        // Role mismatch
        setHasAccess(false);
        setChecking(false);
        return;
      }

      // Any authenticated user has access
      setHasAccess(true);
      setChecking(false);
    };

    checkAccess();
  }, [user, authLoading, requiredRole]);

  // Show loading state
  if (authLoading || checking) {
    return fallback || <ProtectedRouteLoader />;
  }

  // Not authenticated - redirect to login
  if (!user || !hasAccess) {
    // Save the attempted location for redirect back after login
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }}
        replace 
      />
    );
  }

  // Show socket connection warning but still allow access
  if (!isConnected && connectionError) {
    console.warn('⚠️ Real-time connection lost, but page access granted');
    // You could show a toast or banner here, but still render children
  }

  // Render children with additional props
  return children;
}

// ===========================================
// LOADER COMPONENT
// ===========================================

/**
 * Loading spinner component for protected routes
 */
const ProtectedRouteLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl animate-blob"></div>
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
        </div>

        {/* Loading Spinner */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/30 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Loading Text */}
        <h3 className="text-xl font-bold font-display mb-2">
          Checking Authentication
        </h3>
        <p className="text-gray-400 text-sm">
          Please wait while we verify your credentials...
        </p>

        {/* Loading Tips */}
        <div className="mt-8 text-xs text-gray-500 max-w-xs mx-auto">
          <p className="mb-2">💡 Tip: Make sure you're logged in to access this page</p>
          <p>⏱️ This should only take a moment</p>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// ROLE-BASED PROTECTED ROUTE (Convenience Components)
// ===========================================

/**
 * Admin only route
 */
export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute requiredRole="admin" {...props}>
    {children}
  </ProtectedRoute>
);

/**
 * Moderator route (admins also have access)
 */
export const ModeratorRoute = ({ children, ...props }) => (
  <ProtectedRoute requiredRole="moderator" {...props}>
    {children}
  </ProtectedRoute>
);

/**
 * Public route that redirects authenticated users away
 * (useful for login/register pages)
 */
export const PublicOnlyRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <ProtectedRouteLoader />;
  }

  if (user) {
    // Redirect authenticated users away from public pages
    return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
  }

  return children;
};

// ===========================================
// CUSTOM HOOK FOR PROTECTED ROUTES
// ===========================================

/**
 * Hook to check if current user has required permissions
 */
export const useProtectedRoute = (requiredRole = null) => {
  const { user, loading } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setHasPermission(false);
      setChecking(false);
      return;
    }

    if (!requiredRole) {
      setHasPermission(true);
      setChecking(false);
      return;
    }

    if (user.role === 'admin') {
      setHasPermission(true);
      setChecking(false);
      return;
    }

    setHasPermission(user.role === requiredRole);
    setChecking(false);
  }, [user, loading, requiredRole]);

  return {
    hasPermission,
    checking,
    user,
    loading
  };
};

// ===========================================
// CSS ANIMATIONS (add to your global CSS file)
// ===========================================
/* Add to src/index.css or global styles */
/*
@keyframes blob {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}
*/