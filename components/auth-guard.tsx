"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useWorkspace } from '@/contexts/workspace-context';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const { organizations, isLoadingOrganizations } = useWorkspace();
  const router = useRouter();
  const pathname = usePathname();

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/onboarding'];
  const authRoutes = ['/login', '/signup'];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.includes(pathname);

  useEffect(() => {
    if (!loading && !isLoadingOrganizations) {
      if (isProtectedRoute && !user) {
        // User is not logged in but trying to access protected route
        console.log('Redirecting to login - user not authenticated');
        router.push('/login');
      } else if (isAuthRoute && user) {
        // User is logged in but trying to access auth pages
        // Check if they need onboarding or can go to dashboard
        if (organizations.length === 0) {
          console.log('Redirecting to onboarding - user needs to create workspace');
          router.push('/onboarding');
        } else {
          console.log('Redirecting to dashboard - user already has organizations');
          router.push('/dashboard');
        }
      } else if (user && pathname === '/onboarding' && organizations.length > 0) {
        // User has organizations but is on onboarding page
        console.log('Redirecting to dashboard - user already has organizations');
        router.push('/dashboard');
      } else if (user && pathname === '/dashboard' && organizations.length === 0) {
        // User is on dashboard but has no organizations
        console.log('Redirecting to onboarding - user needs to create workspace');
        router.push('/onboarding');
      }
    }
  }, [user, loading, isLoadingOrganizations, organizations.length, isProtectedRoute, isAuthRoute, router, pathname]);

  // Show loading spinner while auth state is being determined
  if (loading || isLoadingOrganizations) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show nothing while redirecting
  if ((isProtectedRoute && !user) || (isAuthRoute && user) || 
      (user && pathname === '/onboarding' && organizations.length > 0) ||
      (user && pathname === '/dashboard' && organizations.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render children if everything is okay
  return <>{children}</>;
}