import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  username: string;
  role: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  user: User;
}

// Login function
async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for sessions
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
}

// Logout function
async function logout(): Promise<void> {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include', // Include cookies for sessions
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }
}

// Get current user function
async function getCurrentUser(): Promise<User> {
  const response = await fetch('/api/auth/me', {
    credentials: 'include', // Include cookies for sessions
  });
  
  if (!response.ok) {
    throw new Error('Not authenticated');
  }

  return response.json();
}

// Custom hook for authentication
export function useAuth() {
  const queryClient = useQueryClient();

  // Query for current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(['currentUser'], null);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    error: error as Error | null,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error as Error | null,
  };
}