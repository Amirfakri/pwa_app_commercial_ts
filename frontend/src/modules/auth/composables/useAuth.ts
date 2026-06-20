import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const authStore = useAuthStore();
  
  return {
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    error: authStore.error,
    isAdmin: authStore.isAdmin,
    isMainAdmin: authStore.isMainAdmin,
    sendOtp: authStore.sendOtp,
    verifyOtp: authStore.verifyOtp,
    checkSession: authStore.checkSession,
    logout: authStore.logout,
    clearError: authStore.clearError,
  };
}