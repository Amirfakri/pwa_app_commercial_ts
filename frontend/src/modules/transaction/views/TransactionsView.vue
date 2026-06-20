<template>
  <div class="transactions-container" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
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
                <span class="connection-dot" :class="{ connected: isConnected, disconnected: !isConnected }" :title="isConnected ? 'متصل' : 'قطع'"></span>
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

    <!-- فیلتر وضعیت و نوع محصول -->
    <div class="filters-card">
      <div class="filters-row">
        <div class="filter-group">
          <label>وضعیت</label>
          <select v-model="tempFilters.status" class="filter-select">
            <option value="">همه</option>
            <option value="pending">در انتظار</option>
            <option value="approved">تأیید شده</option>
            <option value="rejected">رد شده</option>
            <option value="expired">منقضی شده</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>نوع محصول</label>
          <select v-model="tempFilters.product_type" class="filter-select">
            <option value="">همه</option>
            <option value="melted">محصولات آبشده</option>
            <option value="coin">سکه‌ها</option>
          </select>
        </div>

        <div class="filter-group search-btn-group">
          <label>&nbsp;</label>
          <button @click="applyFilters" class="search-btn">جستجو</button>
        </div>
      </div>
    </div>

    <!-- بازه تاریخ -->
    <div class="date-range-card">
      <div class="date-range-header">
        <svg class="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span class="date-range-title">بازه تاریخ</span>
      </div>
      
      <div class="date-range-content">
        <div class="date-range-box">
          <div class="date-input-wrapper">
            <label class="date-label">از تاریخ</label>
            <div class="date-picker-wrapper">
              <Vue3PersianDateTimePicker 
                v-model="tempStartDate"
                :config="dateTimeConfig"
                placeholder="انتخاب تاریخ شروع"
              />
            </div>
          </div>
          
          <div class="date-to-separator">تا</div>
          
          <div class="date-input-wrapper">
            <label class="date-label">تا تاریخ</label>
            <div class="date-picker-wrapper">
              <Vue3PersianDateTimePicker 
                v-model="tempEndDate"
                :config="dateTimeConfig"
                placeholder="انتخاب تاریخ پایان"
              />
            </div>
          </div>
          
          <button @click="clearDates" class="clear-dates-btn" title="پاک کردن بازه تاریخ">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- لودینگ -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>در حال بارگذاری تراکنش‌ها...</p>
    </div>

    <!-- لیست تراکنش‌ها -->
    <div v-else class="transactions-list">
      <div v-for="tx in transactions" :key="tx.id" class="transaction-card" :class="'status-' + tx.status">
        <!-- هدر کارت -->
        <div class="card-header-row">
          <div class="type-product-group">
            <span class="transaction-type-badge" :class="tx.type === 'خرید' ? 'buy-type' : 'sell-type'">
              {{ tx.type === 'خرید' ? 'خرید' : 'فروش' }}
            </span>
            <span class="transaction-product-name">{{ tx.display_name || tx.product_code }}</span>
          </div>

          <div class="date-time-group">
            <span class="transaction-time">{{ formatPersianTime(tx.created_at) }}</span>
            <span class="transaction-date">{{ formatPersianDate(tx.created_at) }}</span>
          </div>

          <div class="status-badge" :class="'status-' + tx.status">
            <span class="status-dot"></span>
            <span>{{ getStatusText(tx.status) }}</span>
          </div>
        </div>
        
        <div class="card-divider"></div>
        
        <div class="card-details">
          <div class="detail-item">
            <span class="detail-label">مقدار:</span>
            <span class="detail-value">
              <strong>{{ tx.coin_quantity ? formatCoinCount(tx.coin_quantity) : formatWeight(tx.melted_weight) }}</strong>
              {{ tx.coin_quantity ? 'عدد' : 'گرم' }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">قیمت:</span>
            <span class="detail-value"><strong>{{ formatNumberWithComma(tx.transaction_price) }}</strong> ریال</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">مبلغ:</span>
            <span class="detail-value"><strong>{{ formatNumberWithComma(tx.amount) }}</strong> ریال</span>
          </div>
        </div>
      </div>

      <div v-if="transactions.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>هیچ تراکنشی یافت نشد</p>
      </div>
    </div>

    <!-- صفحه‌بندی -->
    <div v-if="totalPages > 1" class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        قبلی
      </button>
      <span class="page-info">صفحه {{ currentPage }} از {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">
        بعدی
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
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
import Vue3PersianDateTimePicker from 'vue3-persian-datetime-picker';
import moment from 'moment-jalaali';

moment.loadPersian({ dialect: 'persian-modern' });

const router = useRouter();
const authStore = useAuthStore();
const user = computed(() => authStore.user);

const dateTimeConfig = {
  time: false,
  hour24: true,
  format: 'jYYYY-jMM-jDD',
  placeholder: '',
  locale: 'fa',
  autoSubmit: true,
  showTime: false,
  showTodayButton: true,
  showNowButton: false,
  closeOnSelect: true,
  formatDisplay: 'jYYYY-jMM-jDD',
  displayFormat: 'jYYYY-jMM-jDD',
  theme: 'default',
  initialValue: '',
  color: '#667eea'
};

const isSidebarOpen = ref(false);
const isMobile = ref(window.innerWidth < 768);
const loading = ref(true);
const transactions = ref<any[]>([]);
const totalCount = ref(0);
const currentPage = ref(1);
const limit = ref(20);
const isConnected = ref(false);

const tempStartDate = ref('');
const tempEndDate = ref('');
const tempFilters = ref({
  status: '',
  product_type: ''
});

const activeFilters = ref({
  status: '',
  start_date: '',
  end_date: '',
  product_type: ''
});

let socket: any = null;
let touchStartX = 0;

const totalPages = computed(() => Math.ceil(totalCount.value / limit.value));

const applyFilters = () => {
  activeFilters.value.status = tempFilters.value.status;
  activeFilters.value.product_type = tempFilters.value.product_type;
  
  if (tempStartDate.value && tempStartDate.value.trim() !== '') {
    try {
      const gregorianStart = moment(tempStartDate.value, 'jYYYY-jMM-jDD').format('YYYY-MM-DD');
      activeFilters.value.start_date = gregorianStart;
    } catch (error) {
      activeFilters.value.start_date = '';
    }
  } else {
    activeFilters.value.start_date = '';
  }
  
  if (tempEndDate.value && tempEndDate.value.trim() !== '') {
    try {
      const gregorianEnd = moment(tempEndDate.value, 'jYYYY-jMM-jDD').format('YYYY-MM-DD');
      activeFilters.value.end_date = gregorianEnd;
    } catch (error) {
      activeFilters.value.end_date = '';
    }
  } else {
    activeFilters.value.end_date = '';
  }
  
  currentPage.value = 1;
  loadTransactions();
};

const clearDates = () => {
  tempStartDate.value = '';
  tempEndDate.value = '';
  activeFilters.value.start_date = '';
  activeFilters.value.end_date = '';
  currentPage.value = 1;
  loadTransactions();
};

const persianDate = computed(() => {
  return moment().format('dddd jD jMMMM jYYYY');
});

const formatPersianDate = (date: string) => {
  if (!date) return '';
  const persianDateStr = moment(date).format('jYYYY-jMM-jDD');
  return toPersianNumber(persianDateStr);
};

const formatPersianTime = (date: string) => {
  if (!date) return '';
  const time = moment(date).format('HH:mm');
  return toPersianNumber(time);
};

const toPersianNumber = (str: string): string => {
  const persianNumbers: { [key: string]: string } = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  return str.replace(/[0-9]/g, (char) => persianNumbers[char] || char);
};

const formatNumberWithComma = (num: number | string | null | undefined): string => {
  if (!num || num === 0 || num === '0') return '۰';
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numValue) || numValue === 0) return '۰';
  const formatted = Math.floor(numValue).toLocaleString('en-US');
  return toPersianNumber(formatted);
};

const formatWeight = (num: number | null | undefined): string => {
  if (!num || num === 0) return '۰';
  const rounded = Math.round(num * 1000) / 1000;
  let str = rounded.toString();
  
  if (str.includes('.')) {
    const parts = str.split('.');
    parts[1] = parts[1].slice(0, 3).replace(/0+$/, '');
    if (parts[1].length === 0) {
      str = parts[0];
    } else {
      str = parts[0] + '.' + parts[1];
    }
  }
  return toPersianNumber(str);
};

const formatCoinCount = (num: number | null | undefined): string => {
  if (!num || num === 0) return '۰';
  return toPersianNumber(Math.floor(num).toString());
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: 'در انتظار',
    approved: 'تأیید شده',
    rejected: 'رد شده',
    expired: 'منقضی شده'
  };
  return map[status] || status;
};

const loadTransactions = async () => {
  loading.value = true;
  try {
    let url = `/transactions/user?page=${currentPage.value}&limit=${limit.value}`;
    
    if (activeFilters.value.status) {
      url += `&status=${activeFilters.value.status}`;
    }
    
    if (activeFilters.value.start_date && activeFilters.value.end_date) {
      url += `&start_date=${activeFilters.value.start_date}&end_date=${activeFilters.value.end_date}`;
    } else if (activeFilters.value.start_date) {
      url += `&start_date=${activeFilters.value.start_date}`;
    } else if (activeFilters.value.end_date) {
      url += `&end_date=${activeFilters.value.end_date}`;
    }
    
    const response = await api.get(url);
    
    if (response.data.success) {
      let data = response.data.data || [];
      
      if (activeFilters.value.product_type === 'melted') {
        data = data.filter((tx: any) => tx.product_code?.startsWith('AB_'));
      } else if (activeFilters.value.product_type === 'coin') {
        data = data.filter((tx: any) => tx.product_code?.startsWith('COIN_'));
      }
      
      transactions.value = data;
      totalCount.value = response.data.pagination?.total || data.length;
    }
  } catch (err) {
    // خطا رو نادیده بگیر
  } finally {
    loading.value = false;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadTransactions();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    loadTransactions();
  }
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

const initSocket = () => {
  const socketClient = connectSocket();
  socket = socketClient;
  
  if (user.value?.id) {
    socketClient.emit('join-user', String(user.value.id));
  }
  
  socketClient.on('connect', () => {
    isConnected.value = true;
  });
  
  socketClient.on('transaction_update', (tx: any) => {
    if (String(tx.user_id) === String(user.value?.id)) {
      const index = transactions.value.findIndex(t => t.id === tx.id);
      if (index !== -1) {
        transactions.value[index] = { ...transactions.value[index], ...tx };
        transactions.value = [...transactions.value];
      }
    }
  });
  
  socketClient.on('disconnect', () => {
    isConnected.value = false;
  });
  
  socketClient.on('connect_error', () => {
    isConnected.value = false;
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

const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) isSidebarOpen.value = false;
};

onMounted(() => {
  handleResize();
  loadTransactions();
  initSocket();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.transactions-container {
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
  transition: all 0.2s;
}

.hamburger-btn:hover {
  background: #e8edf2;
  transform: scale(1.02);
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

.filters-card {
  margin: 0 24px 16px 24px;
  background: white;
  border-radius: 20px;
  padding: 16px 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.filters-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 140px;
}

.filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.filter-select {
  padding: 12px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  background: white;
  width: 100%;
  font-family: inherit;
  transition: all 0.2s;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-btn-group {
  flex: 0 0 auto;
}

.search-btn {
  padding: 12px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.date-range-card {
  margin: 0 24px 24px 24px;
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
}

.date-range-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #eef2f6;
}

.calendar-icon {
  width: 22px;
  height: 22px;
  color: #667eea;
}

.date-range-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.date-range-content {
  width: 100%;
}

.date-range-box {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
}

.date-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  padding-right: 4px;
}

.date-picker-wrapper {
  width: 100%;
}

.date-picker-wrapper :deep(.vpd-picker) {
  width: 100%;
  display: block;
}

.date-picker-wrapper :deep(.vpd-input) {
  width: 100%;
  padding: 12px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  font-size: 13px;
  background: #f8fafc;
  font-family: inherit;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.date-picker-wrapper :deep(.vpd-input:hover) {
  border-color: #667eea;
  background: white;
}

.date-picker-wrapper :deep(.vpd-input:focus) {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.date-to-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 0 12px;
  border-radius: 30px;
  height: 42px;
  white-space: nowrap;
  margin-top: 20px;
}

.clear-dates-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  background: #f1f5f9;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  height: 42px;
  margin-top: 20px;
}

.clear-dates-btn svg {
  width: 20px;
  height: 20px;
  color: #64748b;
}

.clear-dates-btn:hover {
  background: #fee2e2;
}

.clear-dates-btn:hover svg {
  color: #ef4444;
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

.transactions-list {
  margin: 0 24px 16px 24px;
}

.transaction-card {
  background: white;
  border-radius: 20px;
  padding: 18px 20px;
  margin-bottom: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  border-right: 4px solid;
}

.transaction-card:hover {
  transform: translateX(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.transaction-card.status-pending {
  border-right-color: #f59e0b;
  background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
}

.transaction-card.status-approved {
  border-right-color: #22c55e;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
}

.transaction-card.status-rejected {
  border-right-color: #ef4444;
  background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
}

.transaction-card.status-expired {
  border-right-color: #94a3b8;
  background: #f8fafc;
  opacity: 0.8;
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: nowrap;
  width: 100%;
}

.type-product-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.transaction-type-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.buy-type {
  background: #2563eb;
  color: white;
}

.sell-type {
  background: #dc2626;
  color: white;
}

.transaction-product-name {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.date-time-group {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  padding: 5px 12px;
  border-radius: 20px;
  flex-shrink: 0;
}

.transaction-time {
  font-size: 11px;
  color: #1e293b;
  font-family: monospace;
  font-weight: 600;
  white-space: nowrap;
}

.transaction-date {
  font-size: 11px;
  color: #1e293b;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-badge.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.status-pending .status-dot {
  background: #f59e0b;
  animation: pulse 1.5s infinite;
}

.status-badge.status-approved {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.status-approved .status-dot {
  background: #22c55e;
}

.status-badge.status-rejected {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.status-rejected .status-dot {
  background: #ef4444;
}

.status-badge.status-expired {
  background: #e2e8f0;
  color: #64748b;
}

.status-badge.status-expired .status-dot {
  background: #94a3b8;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.card-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, #e2e8f0, transparent);
  margin: 14px 0;
}

.card-details {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 24px;
  flex-wrap: wrap;
  padding: 4px 0;
}

.detail-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
}

.detail-label {
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  color: #1e293b;
}

.detail-value strong {
  font-weight: 700;
  color: #0f172a;
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin: 24px 24px 40px;
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s;
}

.page-btn svg {
  width: 16px;
  height: 16px;
}

.page-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.page-btn:hover:not(:disabled) svg {
  stroke: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
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

:deep(.vpd-picker) {
  font-family: inherit;
  width: 100%;
}

:deep(.vpd-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.vpd-header .vpd-header-title) {
  color: white;
}

:deep(.vpd-body .vpd-cell.selected) {
  background: #667eea;
  color: white;
}

:deep(.vpd-body .vpd-cell.today) {
  border: 1px solid #667eea;
}

:deep(.vdp-popup) {
  z-index: 10000;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

@media (max-width: 1200px) {
  .card-header-row {
    gap: 10px;
  }
  
  .transaction-type-badge {
    padding: 4px 10px;
    font-size: 11px;
  }
  
  .transaction-product-name {
    font-size: 12px;
  }
  
  .transaction-time, .transaction-date {
    font-size: 10px;
  }
  
  .date-time-group {
    padding: 4px 10px;
    gap: 5px;
  }
  
  .status-badge {
    padding: 4px 10px;
    font-size: 10px;
  }
}

@media (max-width: 992px) {
  .card-header-row {
    gap: 8px;
  }
  
  .transaction-type-badge {
    padding: 4px 8px;
    font-size: 10px;
  }
  
  .transaction-product-name {
    font-size: 11px;
  }
  
  .date-time-group {
    padding: 4px 8px;
  }
  
  .transaction-time, .transaction-date {
    font-size: 9px;
  }
  
  .status-badge {
    padding: 4px 8px;
    font-size: 9px;
    gap: 4px;
  }
  
  .status-dot {
    width: 6px;
    height: 6px;
  }
}

@media (max-width: 768px) {
  .header-container { padding: 0 16px; height: 70px; }
  .user-role-header { font-size: 16px; }
  .user-name-header { font-size: 11px; }
  .divider-section { margin: 12px 16px 20px; gap: 12px; }
  .date-box { padding: 6px 16px; }
  .date-text { font-size: 11px; }
  
  .filters-card { margin: 0 16px 12px 16px; padding: 12px 16px; }
  .filters-row { gap: 12px; flex-direction: column; }
  .filter-group { min-width: 100%; }
  .filter-group label { font-size: 11px; }
  .filter-select { padding: 9px 8px; font-size: 12px; }
  .search-btn-group { width: 100%; }
  .search-btn { width: 100%; padding: 9px 16px; font-size: 12px; }
  
  .date-range-card { margin: 0 16px 20px 16px; padding: 16px; }
  .date-range-box {
    flex-wrap: wrap;
    gap: 10px;
  }
  .date-input-wrapper {
    min-width: calc(50% - 30px);
    flex: 1;
  }
  .date-to-separator {
    margin-top: 20px;
    height: 38px;
    padding: 0 10px;
  }
  .clear-dates-btn {
    margin-top: 20px;
    height: 38px;
  }
  
  .transactions-list { margin: 0 16px 12px 16px; }
  .transaction-card { padding: 14px 16px; }
  
  .card-header-row {
    gap: 6px;
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 2px;
  }
  
  .type-product-group {
    flex-shrink: 0;
  }
  
  .transaction-type-badge {
    padding: 3px 8px;
    font-size: 9px;
  }
  
  .transaction-product-name {
    font-size: 10px;
    max-width: 80px;
  }
  
  .date-time-group {
    padding: 3px 8px;
    flex-shrink: 0;
  }
  
  .transaction-time, .transaction-date {
    font-size: 8px;
  }
  
  .status-badge {
    padding: 3px 8px;
    font-size: 8px;
    flex-shrink: 0;
  }
  
  .card-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .detail-item {
    width: 100%;
    justify-content: space-between;
  }
  
  .pagination { margin: 20px 16px 32px; }
  .page-btn { padding: 8px 16px; font-size: 12px; }
  
  .loading-state { margin: 0 16px; padding: 40px; }
  .empty-state { padding: 40px; }
  .empty-icon { font-size: 36px; }
}

@media (max-width: 576px) {
  .date-range-box {
    flex-direction: column;
  }
  .date-input-wrapper {
    width: 100%;
    min-width: 100%;
  }
  .date-to-separator {
    margin-top: 0;
    padding: 4px 0;
    height: auto;
    background: transparent;
  }
  .clear-dates-btn {
    width: 100%;
    margin-top: 0;
  }
  
  .card-header-row {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
  }
  
  .card-header-row::-webkit-scrollbar {
    height: 2px;
  }
  
  .card-header-row::-webkit-scrollbar-track {
    background: #e2e8f0;
    border-radius: 10px;
  }
  
  .card-header-row::-webkit-scrollbar-thumb {
    background: #667eea;
    border-radius: 10px;
  }
}

@media (max-width: 400px) {
  .transaction-product-name {
    max-width: 60px;
  }
  
  .transaction-time, .transaction-date {
    font-size: 7px;
  }
  
  .date-time-group {
    gap: 3px;
    padding: 3px 6px;
  }
  
  .status-badge {
    gap: 3px;
    padding: 3px 6px;
  }
}
</style>