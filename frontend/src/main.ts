import { createApp } from 'vue'
import App from './App.vue'
import router from './core/router'
import pinia from './core/store'

// Import interceptors
import './core/http/interceptors'

// Import styles
import './styles/main.css'

// غیرفعال کردن تمام لاگ‌ها در محیط production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.debug = () => {};
}

// ✅ ثبت PWA Service Worker - حذف شرط development
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered successfully:', registration);
      })
      .catch(error => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')