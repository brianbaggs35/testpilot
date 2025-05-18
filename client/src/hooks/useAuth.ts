import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}

export function useUserPreferences() {
  const { user, isLoading } = useAuth();
  const [defaultDashboard, setDefaultDashboard] = useState<string>('automated');
  
  useEffect(() => {
    if (user && user.preferences) {
      setDefaultDashboard(user.preferences.defaultDashboard || 'automated');
    }
  }, [user]);
  
  return {
    defaultDashboard,
    isLoading
  };
}