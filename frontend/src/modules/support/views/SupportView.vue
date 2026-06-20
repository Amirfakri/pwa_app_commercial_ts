<template>
  <div class="support-container" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
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

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>در حال بارگذاری...</p>
    </div>

    <div v-else class="content-list">
      <div 
        v-for="item in activeContents" 
        :key="item.id" 
        class="content-card"
      >
        <div class="card-header-content">
          <div class="header-left">
            <span class="content-icon">{{ getContentIcon(item.id) }}</span>
            <h3>{{ item.title || 'بدون عنوان' }}</h3>
          </div>
          <div class="header-right">
            <div class="date-time-group">
              <span class="update-time">{{ formatPersianTime(item.updated_at) }}</span>
              <span class="update-date">{{ formatPersianDate(item.updated_at) }}</span>
            </div>
          </div>
        </div>
        
        <div class="card-divider"></div>
        
        <div class="card-content-body" v-html="formattedContent(item.content)"></div>
      </div>

      <div v-if="activeContents.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>هیچ محتوایی یافت نشد</p>
      </div>
    </div>

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
const contents = ref<any[]>([]);
const isSocketConnected = ref(false);

let socket: any = null;
let touchStartX = 0;

const activeContents = computed(() => {
  return contents.value
    .filter(item => item.is_active === true)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
});

const persianDate = computed(() => {
  return moment().format('dddd jD jMMMM jYYYY');
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

const formattedContent = (content: string) => {
  if (!content) return '<p class="empty-content">متن این بخش در حال بروزرسانی است...</p>';
  return content.replace(/\n/g, '<br>');
};

const getContentIcon = (id: string): string => {
  const icons: Record<string, string> = {
    box_1: '📘',
    box_2: '📗',
    box_3: '📙',
    box_4: '📕',
    box_5: '📔',
    box_6: '📓',
    box_7: '📒',
    box_8: '📚',
    box_9: '📖',
    box_10: '📰'
  };
  return icons[id] || '📄';
};

const loadContents = async () => {
  loading.value = true;
  try {
    const response = await api.get('/support/descriptions?active_only=false');
    if (response.data.success) {
      contents.value = response.data.data || [];
    }
  } catch (err: any) {
    if (err.response?.status === 401) {
      router.push('/login');
    }
  } finally {
    loading.value = false;
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
  
  socketClient.on('description_updated', () => {
    loadContents();
  });
  
  socketClient.on('descriptions_bulk_updated', () => {
    loadContents();
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
  loadContents();
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

.support-container {
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

.info-card {
  margin: 0 24px 24px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
  color: white;
}

.info-card .card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 0;
  border-bottom: none;
}

.info-card .card-icon {
  font-size: 28px;
}

.info-card .card-header h2 {
  margin: 0;
  font-size: 20px;
  color: white;
}

.info-description {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
  padding-right: 40px;
}

.loading-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 20px;
  margin: 0 24px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.content-list {
  margin: 0 24px 16px 24px;
}

.content-card {
  background: white;
  border-radius: 20px;
  padding: 18px 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  border-right: 4px solid #667eea;
}

.content-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.card-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.content-icon {
  font-size: 24px;
}

.header-left h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.date-time-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
}

.update-time {
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
}

.update-date {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.card-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, #e2e8f0, transparent);
  margin: 12px 0;
}

.card-content-body {
  padding: 8px 0;
  line-height: 1.8;
  color: #475569;
  font-size: 14px;
}

.card-content-body :deep(p) {
  margin-bottom: 12px;
}

.card-content-body :deep(ul),
.card-content-body :deep(ol) {
  padding-right: 20px;
  margin-bottom: 12px;
}

.card-content-body :deep(li) {
  margin-bottom: 5px;
}

.card-content-body :deep(strong) {
  color: #1e293b;
}

.card-content-body :deep(br) {
  margin-bottom: 5px;
}

.empty-content {
  color: #94a3b8;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 20px;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.empty-state p {
  color: #94a3b8;
  font-size: 14px;
}

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

@media (max-width: 768px) {
  .header-container { padding: 0 16px; height: 70px; }
  .user-role-header { font-size: 16px; }
  .user-name-header { font-size: 11px; }
  .divider-section { margin: 12px 16px 20px; gap: 12px; }
  .date-box { padding: 6px 16px; }
  .date-text { font-size: 11px; }
  
  .info-card { margin: 0 16px 16px 16px; padding: 16px; }
  .info-card .card-header h2 { font-size: 18px; }
  .info-description { font-size: 12px; padding-right: 36px; }
  
  .content-list { margin: 0 16px 12px 16px; }
  .content-card { padding: 14px 16px; }
  .content-icon { font-size: 20px; }
  .header-left h3 { font-size: 14px; }
  .date-time-group { padding: 3px 8px; gap: 6px; }
  .update-time { font-size: 9px; }
  .update-date { font-size: 9px; }
  .card-content-body { font-size: 13px; }
  
  .loading-state { margin: 0 16px; padding: 40px; }
  .empty-state { padding: 40px; }
  .empty-icon { font-size: 36px; }
}
</style>