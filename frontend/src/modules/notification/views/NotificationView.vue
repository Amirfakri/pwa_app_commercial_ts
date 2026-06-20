<template>
  <div class="notifications-page">
    <h1>🔔 اعلان‌ها</h1>
    
    <!-- فیلتر تاریخ -->
    <div class="filters-section">
      <div class="filters-header">
        <h3>🔍 فیلتر بر اساس تاریخ</h3>
        <button v-if="hasActiveFilters" class="clear-filters" @click="clearFilters">
          🗑️ حذف فیلترها
        </button>
      </div>
      <DateRangePicker
        :start-value="filters.startDate"
        :end-value="filters.endDate"
        start-placeholder="از تاریخ"
        end-placeholder="تا تاریخ"
        @update:start="updateStartDate"
        @update:end="updateEndDate"
      />
    </div>
    
    <!-- اعلان‌های فعال -->
    <div class="section">
      <h2>اعلان‌های جدید</h2>
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>در حال بارگذاری...</p>
      </div>
      <div v-else-if="activeNotifications.length === 0" class="empty-state">
        <div class="empty-content">
          <span class="empty-icon">🔔</span>
          <p>هیچ اعلان جدیدی وجود ندارد</p>
        </div>
      </div>
      <div v-else class="notifications-list">
        <div 
          v-for="notif in activeNotifications" 
          :key="notif.id" 
          class="notification-card"
          :class="'type-' + notif.notification_type"
        >
          <div class="notification-icon">
            <span>{{ getIcon(notif.notification_type) }}</span>
          </div>
          <div class="notification-content">
            <div class="notification-header">
              <h3 v-if="notif.title">{{ notif.title }}</h3>
              <span class="date">{{ formatDateTime(notif.created_at) }}</span>
            </div>
            <p>{{ notif.message_text }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- پیام روزانه -->
    <div class="section">
      <h2>📢 پیام روزانه</h2>
      <div v-if="dailyMessage" class="daily-message-card">
        <div class="message-icon">📢</div>
        <div class="message-content">
          <p>{{ dailyMessage.message_text }}</p>
          <small>آخرین بروزرسانی: {{ formatDateTime(dailyMessage.updated_at) }}</small>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-content">
          <span class="empty-icon">📭</span>
          <p>پیام روزانه‌ای وجود ندارد</p>
        </div>
      </div>
    </div>

    <!-- تاریخچه اعلان‌ها -->
    <div class="section">
      <h2>📋 تاریخچه اعلان‌ها</h2>
      <div v-if="loadingHistory" class="loading-container">
        <div class="spinner"></div>
        <p>در حال بارگذاری...</p>
      </div>
      <div v-else-if="allNotifications.length === 0" class="empty-state">
        <div class="empty-content">
          <span class="empty-icon">📭</span>
          <p>هیچ اعلانی یافت نشد</p>
        </div>
      </div>
      <div v-else class="notifications-list history">
        <div 
          v-for="notif in allNotifications" 
          :key="notif.id" 
          class="notification-card"
          :class="'type-' + notif.notification_type"
        >
          <div class="notification-icon">
            <span>{{ getIcon(notif.notification_type) }}</span>
          </div>
          <div class="notification-content">
            <div class="notification-header">
              <h3 v-if="notif.title">{{ notif.title }}</h3>
              <span class="date">{{ formatDateTime(notif.created_at) }}</span>
            </div>
            <p>{{ notif.message_text }}</p>
          </div>
        </div>
      </div>
      
      <!-- Pagination -->
      <div class="pagination-controls" v-if="pagination.total > pagination.limit">
        <div class="pagination-info">
          صفحه {{ pagination.page }} از {{ pagination.pages }}
          ({{ formatNumber(pagination.total) }} اعلان)
        </div>
        <div class="pagination-buttons">
          <button 
            class="pagination-button"
            @click="goToPage(pagination.page - 1)"
            :disabled="pagination.page === 1 || loadingHistory"
          >
            ⬅️ قبلی
          </button>
          <button 
            class="pagination-button"
            @click="goToPage(pagination.page + 1)"
            :disabled="pagination.page === pagination.pages || loadingHistory"
          >
            بعدی ➡️
          </button>
        </div>
      </div>
    </div>

    <!-- اعلان پاپ‌آپ زنده -->
    <div v-if="popupNotification.show" class="popup-notification" :class="'type-' + popupNotification.type" @click="closePopup">
      <div class="popup-icon">
        <span>{{ getIcon(popupNotification.type) }}</span>
      </div>
      <div class="popup-content">
        <h4 v-if="popupNotification.title">{{ popupNotification.title }}</h4>
        <p>{{ popupNotification.message }}</p>
      </div>
      <button class="popup-close" @click.stop="closePopup">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { api } from '@/core/http/axios';
import { io, Socket } from 'socket.io-client';
import DateRangePicker from '@/components/common/DateRangePicker.vue';

interface Notification {
  id: number;
  title: string | null;
  message_text: string;
  notification_type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DailyMessage {
  id: number;
  message_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// State
const activeNotifications = ref<Notification[]>([]);
const allNotifications = ref<Notification[]>([]);
const dailyMessage = ref<DailyMessage | null>(null);
const loading = ref(false);
const loadingHistory = ref(false);
let socket: Socket | null = null;

// Filters
const filters = ref({
  startDate: '',
  endDate: ''
});

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0
});

const popupNotification = ref({
  show: false,
  title: '',
  message: '',
  type: 'info',
  timeout: null as any
});

// Computed
const hasActiveFilters = computed(() => {
  return !!(filters.value.startDate || filters.value.endDate);
});

// Helper Functions
const formatNumber = (num: number): string => {
  if (!num && num !== 0) return '۰';
  return num.toLocaleString('fa-IR');
};

const formatDateTime = (date: string): string => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fa-IR') + ' ' + d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
};

const getIcon = (type: string): string => {
  switch(type) {
    case 'success': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    default: return '🔔';
  }
};

// Filter Functions
const updateStartDate = (value: string) => {
  filters.value.startDate = value;
  pagination.value.page = 1;
  loadAllNotifications();
};

const updateEndDate = (value: string) => {
  filters.value.endDate = value;
  pagination.value.page = 1;
  loadAllNotifications();
};

const clearFilters = () => {
  filters.value.startDate = '';
  filters.value.endDate = '';
  pagination.value.page = 1;
  loadAllNotifications();
};

// API Functions
const loadActiveNotifications = async () => {
  loading.value = true;
  try {
    const response = await api.get('/notifications/active');
    if (response.data.success) {
      activeNotifications.value = response.data.data || [];
    }
  } catch (err) {
    console.error('Error loading active notifications:', err);
  } finally {
    loading.value = false;
  }
};

const loadAllNotifications = async () => {
  loadingHistory.value = true;
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit
    };
    
    if (filters.value.startDate) {
      params.start_date = filters.value.startDate;
    }
    if (filters.value.endDate) {
      params.end_date = filters.value.endDate;
    }
    
    const response = await api.get('/notifications', { params });
    if (response.data.success) {
      allNotifications.value = response.data.data || [];
      pagination.value = response.data.pagination;
    }
  } catch (err) {
    console.error('Error loading all notifications:', err);
  } finally {
    loadingHistory.value = false;
  }
};

const loadDailyMessage = async () => {
  try {
    const response = await api.get('/daily-messages/active');
    if (response.data.success) {
      dailyMessage.value = response.data.data;
    }
  } catch (err) {
    console.error('Error loading daily message:', err);
  }
};

const goToPage = (page: number) => {
  if (page < 1 || page > pagination.value.pages) return;
  pagination.value.page = page;
  loadAllNotifications();
};

// Popup Notification
const showPopup = (data: Notification) => {
  if (popupNotification.value.timeout) {
    clearTimeout(popupNotification.value.timeout);
  }
  
  popupNotification.value = {
    show: true,
    title: data.title || '',
    message: data.message_text,
    type: data.notification_type,
    timeout: null
  };
  
  popupNotification.value.timeout = setTimeout(() => {
    popupNotification.value.show = false;
  }, 5000);
};

const closePopup = () => {
  if (popupNotification.value.timeout) {
    clearTimeout(popupNotification.value.timeout);
  }
  popupNotification.value.show = false;
};

// WebSocket
const initSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  const wsUrl = import.meta.env.PROD ? window.location.origin : (import.meta.env.VITE_WS_URL || 'http://localhost:5000');
  
  socket = io(wsUrl, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    path: '/socket.io'
  });
  
  socket.on('connect', () => {
    console.log('🔌 Notification socket connected');
    const userId = localStorage.getItem('userId');
    if (userId) {
      socket?.emit('join-user', userId);
    }
  });
  
  socket.on('new_notification', (data: Notification) => {
    console.log('🔔 New notification received:', data);
    activeNotifications.value = [data, ...activeNotifications.value];
    showPopup(data);
    loadAllNotifications();
  });
  
  socket.on('daily_message_updated', (data: DailyMessage) => {
    console.log('📢 Daily message updated:', data);
    dailyMessage.value = data;
  });
  
  socket.on('transaction_update', (data: any) => {
    if (data.status === 'approved') {
      showPopup({
        id: data.id,
        title: 'تراکنش تأیید شد',
        message_text: `تراکنش شما به مبلغ ${data.amount.toLocaleString('fa-IR')} ریال تأیید شد`,
        notification_type: 'success',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else if (data.status === 'rejected') {
      showPopup({
        id: data.id,
        title: 'تراکنش رد شد',
        message_text: `تراکنش شما به مبلغ ${data.amount.toLocaleString('fa-IR')} ریال رد شد`,
        notification_type: 'error',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Notification socket disconnected');
  });
};

onMounted(() => {
  loadActiveNotifications();
  loadAllNotifications();
  loadDailyMessage();
  initSocket();
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
  if (popupNotification.value.timeout) {
    clearTimeout(popupNotification.value.timeout);
  }
});
</script>

<style scoped>
.notifications-page {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.notifications-page h1 {
  margin-bottom: 24px;
  color: #1a1a2e;
  font-size: 28px;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

/* Filters Section */
.filters-section {
  background: white;
  border-radius: 20px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.filters-section:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
}

.filters-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.clear-filters {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.clear-filters:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(238, 90, 36, 0.3);
}

.section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.section:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}

.section h2 {
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 3px solid #667eea;
  display: inline-block;
}

/* Loading States */
.loading-container {
  text-align: center;
  padding: 60px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.6;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Notifications List */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-card {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.notification-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.notification-card:hover::before {
  transform: scaleX(1);
}

.notification-card:hover {
  transform: translateX(-6px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  background: white;
}

.notification-card.type-info {
  border-right: 5px solid #2196f3;
}
.notification-card.type-success {
  border-right: 5px solid #4caf50;
}
.notification-card.type-warning {
  border-right: 5px solid #ff9800;
}
.notification-card.type-error {
  border-right: 5px solid #f44336;
}

.notification-icon {
  font-size: 32px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.notification-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.notification-header .date {
  font-size: 11px;
  color: #999;
  direction: ltr;
  background: #f0f0f0;
  padding: 4px 10px;
  border-radius: 20px;
}

.notification-content p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

/* Daily Message Card */
.daily-message-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  gap: 20px;
  align-items: center;
  color: white;
  transition: all 0.3s ease;
  animation: glow 2s infinite;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.5); }
  50% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.8); }
}

.daily-message-card:hover {
  transform: scale(1.02);
}

.message-icon {
  font-size: 48px;
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.message-content {
  flex: 1;
}

.message-content p {
  margin: 0 0 10px;
  font-size: 16px;
  line-height: 1.6;
  font-weight: 500;
}

.message-content small {
  font-size: 12px;
  opacity: 0.9;
}

/* Pagination */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #f0f0f0;
}

.pagination-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.pagination-buttons {
  display: flex;
  gap: 12px;
}

.pagination-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.pagination-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Popup Notification */
.popup-notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  max-width: 400px;
  background: white;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  gap: 15px;
  align-items: flex-start;
  box-shadow: 0 15px 40px rgba(0,0,0,0.2);
  z-index: 2000;
  border-right: 5px solid;
  animation: slideInRight 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  cursor: pointer;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.popup-notification.type-info { border-right-color: #2196f3; }
.popup-notification.type-success { border-right-color: #4caf50; }
.popup-notification.type-warning { border-right-color: #ff9800; }
.popup-notification.type-error { border-right-color: #f44336; }

.popup-icon {
  font-size: 32px;
  animation: bounce 1s ease;
}

.popup-content {
  flex: 1;
}

.popup-content h4 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.popup-content p {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.popup-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
  padding: 4px;
  transition: all 0.3s ease;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.popup-close:hover {
  color: #333;
  background: #f0f0f0;
  transform: rotate(90deg);
}

@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .notifications-page {
    padding: 16px;
  }
  
  .section {
    padding: 18px;
  }
  
  .notification-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .popup-notification {
    left: 16px;
    right: 16px;
    bottom: 16px;
    max-width: calc(100% - 32px);
  }
  
  .filters-section {
    padding: 16px;
  }
  
  .notification-card:hover {
    transform: translateX(-3px);
  }
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a67d8, #6b46a0);
}
</style>