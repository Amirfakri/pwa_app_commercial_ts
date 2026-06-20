import { api } from './axios';

// Request interceptor - اضافه کردن توکن
api.interceptors.request.use(
  (config) => {
    const sessionToken = localStorage.getItem('session_token');
    const deviceId = localStorage.getItem('device_id');
    const userId = localStorage.getItem('user_id');
    
    if (sessionToken) {
      config.headers['x-session-token'] = sessionToken;
    }
    if (deviceId) {
      config.headers['x-device-id'] = deviceId;
    }
    if (userId) {
      config.headers['x-user-id'] = userId;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - مدیریت خطاها
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);