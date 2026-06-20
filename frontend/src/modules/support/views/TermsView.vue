<!-- frontend/src/modules/support/views/TermsView.vue -->
<template>
  <div class="terms-container" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <!-- هدر -->
    <header class="app-header">
      <div class="header-container">
        <div class="header-left-side">
          <button @click="toggleSidebar" class="hamburger-btn">
            <span class="hamburger-icon">☰</span>
          </button>
          <div class="user-info-header">
            <div class="user-details-header">
              <span class="user-role-header">آبشده فکری</span>
              <div class="user-name-row-header">
               <span class="connection-dot" :class="{ connected: isSocketConnected, disconnected: !isSocketConnected }" :title="isSocketConnected ? 'متصل' : 'قطع'"></span>
                <span class="user-name-header">{{ user?.full_name || user?.mobile_number }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="header-right-side">
          <div class="logo">
            <img src="/logo.svg" alt="Logo" class="logo-img" />
          </div>
        </div>
      </div>
    </header>

    <div class="divider-section">
      <div class="divider-line"></div>
      <div class="date-box">
        <span class="date-text">{{ persianDate }}</span>
      </div>
      <div class="divider-line"></div>
    </div>

    <!-- کارت شرایط و قوانین -->
    <div class="terms-card">
      <div class="card-header">
        <span class="card-icon">📜</span>
        <h2>شرایط و قوانین</h2>
        <div class="version-badge" v-if="terms">
          نسخه {{ terms.version }}
        </div>
      </div>
      
      <div class="card-body">
        <!-- لودینگ -->
        <div v-if="loading" class="loading-state-inline">
          <div class="spinner-small"></div>
          <span>در حال بارگذاری...</span>
        </div>

        <!-- محتوا -->
        <div v-else-if="terms" class="terms-content">
          <div class="content-body" v-html="formattedContent"></div>
          
          <!-- بخش پذیرش شرایط -->
          <div class="acceptance-section" v-if="needsAcceptance">
            <div class="divider-light"></div>
            <div class="acceptance-box">
              <label class="checkbox-label">
                <input type="checkbox" v-model="agreed" />
                <span>شرایط و قوانین را مطالعه کرده و می‌پذیرم</span>
              </label>
              <button 
                @click="acceptTerms" 
                :disabled="!agreed || accepting"
                class="btn-accept"
              >
                <span v-if="accepting" class="btn-spinner"></span>
                {{ accepting ? 'در حال ثبت...' : 'تأیید و ادامه' }}
              </button>
            </div>
          </div>
          
          <div v-else class="already-accepted">
            <div class="accepted-badge">
              <span class="accepted-icon">✓</span>
              شما قبلاً آخرین نسخه شرایط را پذیرفته‌اید
            </div>
          </div>
        </div>
        
        <div v-else class="empty-state-inline">
          <span class="empty-icon">📭</span>
          <p>هیچ شرایط و قوانینی یافت نشد</p>
        </div>
      </div>
    </div>

    <!-- سایدبار منو -->
    <div class="sidebar-overlay" v-show="isSidebarOpen" @click="toggleSidebar"></div>
    <div class="sidebar" :class="{ 'sidebar-open': isSidebarOpen }">
      <div class="sidebar-header">
        <div class="logo-sidebar">
          <img src="/logo.svg" alt="Logo" class="logo-img-sidebar" />
        </div>
        <button @click="toggleSidebar" class="close-sidebar-btn">✕</button>
      </div>
      
      <div class="user-info-sidebar">
        <div class="user-avatar">
          <span class="avatar-icon">👤</span>
        </div>
        <div class="user-info-text">
          <span class="sidebar-user-name">{{ user?.full_name || user?.mobile_number }}</span>
          <div class="user-phone-divider">
            <span class="sidebar-user-phone">{{ user?.mobile_number }}</span>
          </div>
        </div>
      </div>
      
      <nav class="nav">
        <router-link to="/dashboard" class="nav-link" @click="closeSidebarOnMobile" active-class="active-link">
          <span>📊</span> <span class="nav-text">داشبورد</span>
        </router-link>
        <router-link to="/transactions" class="nav-link" @click="closeSidebarOnMobile" active-class="active-link">
          <span>💳</span> <span class="nav-text">تراکنش‌ها</span>
        </router-link>
        <router-link to="/balance" class="nav-link" @click="closeSidebarOnMobile" active-class="active-link">
          <span>⚖️</span> <span class="nav-text">مانده حساب</span>
        </router-link>
        <router-link to="/remittances" class="nav-link" @click="closeSidebarOnMobile" active-class="active-link">
          <span>📦</span> <span class="nav-text">حواله‌ها</span>
        </router-link>
        <router-link to="/support" class="nav-link" @click="closeSidebarOnMobile" active-class="active-link">
          <span>📞</span> <span class="nav-text">پشتیبانی</span>
        </router-link>
        <router-link to="/terms" class="nav-link" @click="closeSidebarOnMobile" active-class="active-link">
          <span>📜</span> <span class="nav-text">شرایط و قوانین</span>
        </router-link>
      </nav>  
        
      <div class="sidebar-footer">
        <div class="footer-text">
          محصولی از گروه <strong>آبشده فکری</strong>
        </div>
        <button @click="handleLogout" class="logout-btn-sidebar">
          <span>🚪</span> خروج
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/auth/stores/authStore';
import { api } from '@/core/http/axios';
import { connectSocket } from '@/core/socket/socket.io';
import moment from 'moment-jalaali';

moment.loadPersian({ dialect: 'persian-modern' });

const router = useRouter();
const authStore = useAuthStore();
const user = computed(() => authStore.user);

const isSidebarOpen = ref(false);
const isMobile = ref(window.innerWidth < 768);
const loading = ref(true);
const terms = ref<any>(null);
const needsAcceptance = ref(false);
const agreed = ref(false);
const accepting = ref(false);
const isSocketConnected = ref(false);

let socket: any = null;
let touchStartX = 0;

const persianDate = computed(() => {
  return moment().format('dddd jD jMMMM jYYYY');
});

const formattedContent = computed(() => {
  if (!terms.value?.content) return '';
  return terms.value.content.replace(/\n/g, '<br>');
});

const toPersianNumber = (num: number | string): string => {
  if (num === undefined || num === null) return '۰';
  const str = String(num);
  const persianNumbers: { [key: string]: string } = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  return str.replace(/[0-9]/g, (char) => persianNumbers[char] || char);
};

const formatPersianDate = (date: string) => {
  if (!date) return '-';
  return moment(date).format('jYYYY-jMM-jDD');
};

const formatPersianTime = (date: string) => {
  if (!date) return '-';
  const time = moment(date).format('HH:mm:ss');
  return toPersianNumber(time);
};

const loadTerms = async () => {
  loading.value = true;
  try {
    const termsResponse = await api.get('/support/terms');
    if (termsResponse.data.success) {
      terms.value = termsResponse.data.data;
    }
    
    const checkResponse = await api.get('/support/terms/check');
    if (checkResponse.data.success) {
      needsAcceptance.value = checkResponse.data.data.needsAcceptance;
    }
  } catch (err) {
    // خطا را نادیده بگیر
  } finally {
    loading.value = false;
  }
};

const acceptTerms = async () => {
  if (!agreed.value) return;
  
  accepting.value = true;
  try {
    const response = await api.post('/support/terms/accept', {
      version: terms.value?.version
    });
    if (response.data.success) {
      if (response.data.needsRedirect) {
        router.push('/dashboard');
      }
    }
  } catch (err) {
    router.push('/dashboard');
  } finally {
    accepting.value = false;
  }
};

const initSocket = () => {
  const socketClient = connectSocket();
  socket = socketClient;
  
  if (user.value?.id) {
    socketClient.emit('join-user', String(user.value.id));
  }
  
  socketClient.on('connect', () => {
    isSocketConnected.value = true;
  });
  
  socketClient.on('terms_updated', () => {
    loadTerms();
  });
  
  socketClient.on('disconnect', () => {
    isSocketConnected.value = false;
  });
  
  socketClient.on('connect_error', () => {
    isSocketConnected.value = false;
  });
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebarOnMobile = () => {
  if (isMobile.value) isSidebarOpen.value = false;
};

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

const onTouchStart = (e: TouchEvent) => {
  touchStartX = e.touches[0].clientX;
};

const onTouchMove = (e: TouchEvent) => {
  const touchCurrentX = e.touches[0].clientX;
  const diffX = touchCurrentX - touchStartX;
  
  if (diffX > 50 && !isSidebarOpen.value) {
    e.preventDefault();
    router.push('/dashboard');
  }
};

const onTouchEnd = () => {
  touchStartX = 0;
};

const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) isSidebarOpen.value = false;
};

onMounted(() => {
  handleResize();
  loadTerms();
  initSocket();
  window.addEventListener('resize', handleResize);
  document.addEventListener('touchstart', onTouchStart);
  document.addEventListener('touchmove', onTouchMove);
  document.addEventListener('touchend', onTouchEnd);
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('touchstart', onTouchStart);
  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('touchend', onTouchEnd);
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.terms-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fb 0%, #eef2f6 100%);
  overflow-x: hidden;
}

.app-header {
  background: transparent;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  padding: 0 32px;
  background: transparent;
}

.header-left-side {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
  flex: 1;
}

.hamburger-btn {
  background: white;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  flex-shrink: 0;
}

.hamburger-btn:hover {
  background: #e8edf2;
}

.hamburger-icon {
  font-size: 24px;
  color: #4a5568;
}

.user-info-header {
  min-width: 0;
  flex: 1;
}

.user-role-header {
  font-size: 20px;
  font-weight: 800;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.user-name-row-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.user-name-header {
  font-weight: 500;
  color: #64748b;
  font-size: 13px;
  white-space: nowrap;
}

.connection-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.connection-dot.connected {
  background-color: #27ae60;
  box-shadow: 0 0 6px #27ae60;
  animation: pulse-green 1.5s infinite;
}

.connection-dot.disconnected {
  background-color: #e74c3c;
  box-shadow: 0 0 4px #e74c3c;
}

@keyframes pulse-green {
  0% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(39, 174, 96, 0); }
  100% { box-shadow: 0 0 0 0 rgba(39, 174, 96, 0); }
}

.header-right-side {
  flex-shrink: 0;
}

.logo-img {
  height: 45px;
  width: auto;
  object-fit: contain;
}

.divider-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 16px 32px 24px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #cbd5e1, #cbd5e1, transparent);
}

.date-box {
  background: white;
  padding: 8px 24px;
  border-radius: 40px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
  white-space: nowrap;
}

.date-text {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

/* کارت شرایط و قوانین */
.terms-card {
  margin: 0 24px 24px 24px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-icon {
  font-size: 24px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  flex: 1;
}

.version-badge {
  background: rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.card-body {
  padding: 20px;
}

.loading-state-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: #64748b;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.terms-content {
  line-height: 1.8;
  color: #475569;
  font-size: 14px;
}

.content-body :deep(p) {
  margin-bottom: 16px;
}

.content-body :deep(ul),
.content-body :deep(ol) {
  padding-right: 24px;
  margin-bottom: 16px;
}

.content-body :deep(li) {
  margin-bottom: 8px;
}

.content-body :deep(strong) {
  color: #1e293b;
}

.content-body :deep(h1),
.content-body :deep(h2),
.content-body :deep(h3) {
  color: #1e293b;
  margin-top: 20px;
  margin-bottom: 12px;
}

.divider-light {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, #e2e8f0, transparent);
  margin: 24px 0 20px;
}

.acceptance-section {
  margin-top: 8px;
}

.acceptance-box {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 16px;
  text-align: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  margin-bottom: 20px;
}

.checkbox-label input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.btn-accept {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 30px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.btn-accept:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(39,174,96,0.3);
}

.btn-accept:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.already-accepted {
  text-align: center;
  padding: 10px 0;
}

.accepted-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #e8f5e9;
  color: #27ae60;
  padding: 12px 24px;
  border-radius: 30px;
  font-size: 14px;
}

.accepted-icon {
  font-size: 18px;
  font-weight: bold;
}

.empty-state-inline {
  text-align: center;
  padding: 60px;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state-inline p {
  color: #94a3b8;
  font-size: 14px;
}

/* سایدبار */
.sidebar {
  position: fixed;
  top: 0;
  right: -100%;
  width: 85%;
  max-width: 300px;
  height: 100vh;
  background: white;
  transition: right 0.3s ease;
  z-index: 1002;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 25px rgba(0,0,0,0.1);
  overflow-y: auto;
}

.sidebar-open {
  right: 0 !important;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1001;
}

.nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar-footer {
  flex-shrink: 0;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.logo-img-sidebar {
  height: 45px;
  width: auto;
}

.close-sidebar-btn {
  background: #e8edf2;
  border: none;
  color: #64748b;
  font-size: 18px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
}

.user-info-sidebar {
  background: #f8f9fa;
  margin: 0 16px 20px 16px;
  padding: 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.user-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 24px;
}

.user-info-text {
  flex: 1;
  min-width: 0;
}

.sidebar-user-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user-phone {
  font-size: 12px;
  color: #64748b;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  color: #475569;
  text-decoration: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.nav-link:hover {
  background: #e8edf2;
  color: #1e293b;
}

.active-link {
  background: #e8edf2;
  color: #667eea;
}

.nav-text {
  flex: 1;
  text-align: right;
}

.footer-text {
  text-align: center;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 16px;
}

.logout-btn-sidebar {
  width: 100%;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #ef4444;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

/* ریسپانسیو */
@media (max-width: 768px) {
  .header-container { padding: 0 16px; height: 70px; }
  .user-role-header { font-size: 16px; }
  .user-name-header { font-size: 11px; }
  .divider-section { margin: 12px 16px 20px; gap: 12px; }
  .date-box { padding: 6px 16px; }
  .date-text { font-size: 11px; }
  
  .terms-card { margin: 0 16px 16px 16px; }
  .card-header { padding: 14px 16px; }
  .card-header h2 { font-size: 16px; }
  .version-badge { font-size: 10px; }
  .card-body { padding: 16px; }
  .terms-content { font-size: 13px; }
  .acceptance-box { padding: 16px; }
  .btn-accept { padding: 10px 24px; font-size: 14px; }
  .accepted-badge { padding: 10px 20px; font-size: 12px; }
  .empty-state-inline { padding: 40px; }
  .empty-icon { font-size: 36px; }
}
</style>