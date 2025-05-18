import { QueryClient } from '@tanstack/react-query';

// Create a request function that handles JSON responses
export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Check if the response is ok (status in the range 200-299)
  if (!response.ok) {
    // Try to parse the error response as JSON
    try {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `API error: ${response.status} ${response.statusText}`
      );
    } catch (parseError) {
      // If parsing as JSON fails, throw a generic error
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
  }

  // For 204 No Content responses, return null
  if (response.status === 204) {
    return null;
  }

  // Otherwise, parse the JSON response
  return await response.json();
}

// Create a default query client with custom settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Set default query function to use our apiRequest
      queryFn: async ({ queryKey }) => {
        // For array query keys, use the first element as the URL
        const url = Array.isArray(queryKey) ? queryKey[0] as string : queryKey as string;
        return apiRequest(url);
      },
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});