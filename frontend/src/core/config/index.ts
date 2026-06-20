export const config = {
  appName: import.meta.env.VITE_APP_NAME || 'PWA Gold App',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:5001/ws',
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
};