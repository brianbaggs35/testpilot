import { useQuery } from "@tanstack/react-query";
import { User } from "../../shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    retry: false,
    // Don't redirect on error (401)
    throwOnError: false
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error
  };
}

export function useUserPreferences() {
  const { user } = useAuth();
  
  return {
    defaultDashboard: user?.preferences?.defaultDashboard || 'manual',
    theme: user?.preferences?.theme || 'light',
    kanbanSettings: user?.preferences?.kanbanSettings || {
      columns: ['to-do', 'in-progress', 'blocked', 'passed', 'failed']
    },
    reportSettings: user?.preferences?.reportSettings || {
      defaultTemplateName: 'Standard',
      includeCharts: true,
      includeSummary: true,
      includeTestCases: true,
      pageSize: 'A4'
    }
  };
}