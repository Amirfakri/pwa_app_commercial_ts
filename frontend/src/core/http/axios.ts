import axios from 'axios';

// تنظیم baseURL بر اساس محیط
const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // در تولید، از دامنه جاری استفاده می‌شود
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');  // در توسعه

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      console.log('Unauthorized - redirecting to login');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);