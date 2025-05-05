'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Client component to check session validity and redirect if needed.
 * This works with the API route to handle session expiration and extension.
 */
export default function SessionManager({ 
  requireRole = [],
  children 
}: { 
  requireRole?: string[];
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    // Function to check session validity
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session/check');
        const data = await response.json();
        
        if (!data.valid) {
          // Session is invalid, redirect to login
          router.replace('/login');
          return;
        }
        
        // Check role requirements if any
        if (requireRole.length > 0 && !requireRole.includes(data.role)) {
          router.replace('/unauthorized');
          return;
        }
        
        // Session is valid, update loading state
        setIsLoading(false);
      } catch (error) {
        // On error, redirect to login as a precaution
        router.replace('/login');
      }
    };
    
    // Check session when component mounts
    checkSession();
    
    // Set up periodic checks every 5 minutes
    const intervalId = setInterval(checkSession, 5 * 60 * 1000);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [router, requireRole]);
  
  // Show loading indicator while checking session
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // Render children when session is valid
  return <>{children}</>;
} 