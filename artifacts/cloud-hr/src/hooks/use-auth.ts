import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGetCurrentUserQueryKey, getCurrentUser, login, logout, LoginRequest } from "@workspace/api-client-react";

export function useAuth() {
  const queryClient = useQueryClient();
  const queryKey = getGetCurrentUserQueryKey();

  const { data: user, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getCurrentUser(),
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.setQueryData(queryKey, null);
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    isAdmin: user?.role === "admin",
    isManager: user?.role === "manager",
    isEmployee: user?.role === "employee",
  };
}
