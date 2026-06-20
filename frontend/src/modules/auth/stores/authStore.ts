import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/core/http/axios';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAdmin = computed(() => user.value?.isAdmin === true);
  const isMainAdmin = computed(() => user.value?.is_main_admin === true);

  let checkPromise: Promise<any> | null = null;

  async function checkSession() {
    if (checkPromise) {
      return checkPromise;
    }
    
    if (isLoading.value) return;
    
    isLoading.value = true;
    checkPromise = (async () => {
      try {
        const response = await api.get('/auth/check-session');
        if (response.data.authenticated) {
          user.value = response.data.user;
          isAuthenticated.value = true;
          localStorage.setItem('user_role', user.value.isAdmin ? 'admin' : 'user');
        } else {
          user.value = null;
          isAuthenticated.value = false;
          localStorage.removeItem('user_role');
        }
      } catch (err) {
        user.value = null;
        isAuthenticated.value = false;
      } finally {
        isLoading.value = false;
        checkPromise = null;
      }
    })();
    
    return checkPromise;
  }

  async function sendOtp(mobile: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.post('/auth/send-otp', { mobile });
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'خطا در ارسال کد';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function verifyOtp(mobile: string, otp: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await api.post('/auth/verify-otp', { mobile, otp });
      if (response.data.success) {
        user.value = response.data.user;
        isAuthenticated.value = true;
        localStorage.setItem('user_role', user.value.isAdmin ? 'admin' : 'user');
      }
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'خطا در تأیید کد';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    isLoading.value = true;
    try {
      await api.post('/auth/logout');
      user.value = null;
      isAuthenticated.value = false;
      localStorage.removeItem('user_role');
    } catch (err) {
    } finally {
      isLoading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isMainAdmin,
    checkSession,
    sendOtp,
    verifyOtp,
    logout,
    clearError,
  };
});