<template>
  <div class="remittances-container" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
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

    <!-- فرم ثبت حواله جدید -->
    <div class="create-card">
      <div class="card-header">
        <span class="card-icon">➕</span>
        <h2>ثبت حواله جدید</h2>
      </div>
      <form @submit.prevent="createRemittance">
        <div class="form-row">
          <div class="form-group">
            <label>نوع حواله <span class="required">*</span></label>
            <select v-model="newRemittance.type" class="form-select">
              <option value="وزنی">وزنی (طلا)</option>
              <option value="ریالی">ریالی</option>
              <option value="سکه">سکه</option>
            </select>
          </div>
          
          <div class="form-group" v-if="newRemittance.type === 'وزنی'">
            <label>وزن (گرم) <span class="required">*</span></label>
            <div class="weight-input-wrapper">
              <input 
                type="text" 
                inputmode="decimal"
                v-model="weightInputValue"
                @input="handleWeightInput"
                @keydown="handleWeightKeydown"
                @blur="handleWeightBlur"
                class="form-input"
                placeholder="مثال: 10.5"
              />
              <span class="weight-unit">گرم</span>
            </div>
            <small class="hint">حداکثر 3 رقم اعشار (مثال: 10.5 یا 10.500)</small>
            <small class="error-hint" v-if="weightError">
              <span class="error-icon">⚠️</span> {{ weightError }}
            </small>
          </div>
          
          <div class="form-group" v-if="newRemittance.type === 'ریالی'">
            <label>مبلغ (ریال) <span class="required">*</span></label>
            <input 
              type="number" 
              v-model.number="newRemittance.amount" 
              class="form-input"
              placeholder="مثال: 5000000"
            />
          </div>
          
          <div class="form-group" v-if="newRemittance.type === 'سکه'">
            <label>تعداد سکه <span class="required">*</span></label>
            <input 
              type="number" 
              v-model.number="newRemittance.coin_count" 
              class="form-input"
              placeholder="مثال: 2"
            />
          </div>
          
          <div class="form-group">
            <label>نام گیرنده <span class="required">*</span></label>
            <input 
              type="text" 
              v-model="newRemittance.recipient" 
              @input="validatePersianName"
              class="form-input"
              placeholder="نام کامل گیرنده (فقط فارسی)"
              required
            />
            <small class="hint">فقط حروف فارسی مجاز است</small>
          </div>
          
          <div class="form-group full-width">
            <label>توضیحات</label>
            <textarea 
              v-model="newRemittance.description" 
              class="form-textarea"
              rows="3"
              placeholder="توضیحات اختیاری..."
            ></textarea>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" :disabled="loading || !isFormValid" class="btn-primary">
            <span v-if="loading" class="spinner-small"></span>
            {{ loading ? 'در حال ثبت...' : 'ثبت حواله' }}
          </button>
          <button type="button" @click="resetForm" class="btn-secondary">
            پاک کردن فرم
          </button>
        </div>
      </form>
    </div>

    <!-- فیلتر تاریخ و وضعیت -->
    <div class="filters-card">
      <div class="filters-row">
        <div class="filter-group date-filter-group">
          <label>تاریخ</label>
          <div class="date-picker-container">
            <Vue3PersianDateTimePicker 
              v-model="selectedDate"
              :config="dateTimeConfig"
              placeholder="انتخاب تاریخ"
              @update:modelValue="onDateSelect"
            />
          </div>
        </div>
        
        <div class="filter-group">
          <label>وضعیت</label>
          <select v-model="statusFilter" @change="filterRemittances" class="filter-select">
            <option value="">همه</option>
            <option value="در حال بررسی">در انتظار</option>
            <option value="تأییدشده">تأیید شده</option>
            <option value="ردشده">رد شده</option>
            <option value="تحویل شده">تحویل شده</option>
          </select>
        </div>
        
        <button @click="refreshData" class="btn-refresh" :disabled="loadingRemittances">
          🔄 بروزرسانی
        </button>
      </div>
    </div>

    <!-- لودینگ -->
    <div v-if="loadingRemittances" class="loading-state">
      <div class="spinner"></div>
      <p>در حال بارگذاری حواله‌ها...</p>
    </div>

    <!-- لیست حواله‌ها -->
    <div v-else class="remittances-list">
      <div 
        v-for="item in filteredRemittances" 
        :key="item.id" 
        class="remittance-card" 
        :class="['remittance-card', { 'status-changed': item.id === lastChangedId }, `status-${getStatusClass(item.status)}`]"
      >
        <div class="card-header">
          <div class="header-left">
            <span class="remittance-type-badge" :class="'type-' + getTypeClass(item.type)">
              {{ getTypeIcon(item.type) }} {{ item.type }}
            </span>
            <span class="remittance-recipient">{{ item.recipient }}</span>
          </div>
          <div class="header-right">
            <div class="date-time-group">
              <span class="transaction-time">{{ formatPersianTime(item.created_at) }}</span>
              <span class="transaction-date">{{ formatPersianDate(item.created_at) }}</span>
            </div>
            <div class="status-badge" :class="'status-' + getStatusClass(item.status)">
              <span class="status-dot"></span>
              <span>{{ item.status }}</span>
            </div>
          </div>
        </div>
        
        <div class="card-divider"></div>
        
        <div class="card-description">
          <span class="description-text">
            <strong>مقدار:</strong> {{ formatAmount(item) }}
            <span v-if="item.description" class="description-separator"> | </span>
            <span v-if="item.description"><strong>توضیحات:</strong> {{ item.description }}</span>
          </span>
        </div>
      </div>

      <div v-if="filteredRemittances.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>هیچ حواله‌ای یافت نشد</p>
      </div>
    </div>

    <!-- صفحه‌بندی -->
    <div v-if="totalPages > 1" class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">قبلی</button>
      <span class="page-info">صفحه {{ currentPage }} از {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages" class="page-btn">بعدی</button>
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

    <!-- اعلان تغییر وضعیت -->
    <div v-if="notification.show" class="notification-toast" @click="closeNotification">
      <div class="notification-content">
        <span class="notification-icon">{{ notification.icon }}</span>
        <div class="notification-text">
          <strong>{{ notification.title }}</strong>
          <p>{{ notification.message }}</p>
        </div>
        <button class="notification-close" @click.stop="closeNotification">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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

// تنظیمات تقویم شمسی
const dateTimeConfig = {
  time: false,
  hour24: true,
  format: 'jYYYY-jMM-jDD',
  placeholder: 'انتخاب تاریخ',
  locale: 'fa',
  autoSubmit: true,
  showTime: false,
  showTodayButton: true,
  showNowButton: false,
  closeOnSelect: true,
  formatDisplay: 'jYYYY-jMM-jDD',
  displayFormat: 'jYYYY-jMM-jDD'
};

// State
const isSidebarOpen = ref(false);
const isMobile = ref(window.innerWidth < 768);
const loading = ref(false);
const loadingRemittances = ref(true);
const remittances = ref<any[]>([]);
const currentPage = ref(1);
const limit = ref(20);
const totalCount = ref(0);
const isSocketConnected = ref(false);
const lastChangedId = ref<number | null>(null);
const selectedDate = ref('');
const statusFilter = ref('');

let socket: any = null;
let touchStartX = 0;

const notification = ref({
  show: false,
  icon: '📦',
  title: '',
  message: '',
  timeout: null as any
});

// Weight input state
const weightInputValue = ref('');
const weightError = ref('');

const newRemittance = ref({
  type: 'وزنی',
  weight: null as number | null,
  amount: null as number | null,
  coin_count: null as number | null,
  recipient: '',
  description: ''
});

// ==================== Computed ====================
const totalPages = computed(() => Math.ceil(totalCount.value / limit.value));

const filteredRemittances = computed(() => {
  let result = remittances.value;
  
  if (statusFilter.value) {
    result = result.filter(r => r.status === statusFilter.value);
  }
  
  return result;
});

const isFormValid = computed(() => {
  if (!newRemittance.value.recipient.trim()) return false;
  
  if (newRemittance.value.type === 'وزنی') {
    if (!newRemittance.value.weight || newRemittance.value.weight <= 0) return false;
    if (weightError.value) return false;
    return true;
  } else if (newRemittance.value.type === 'ریالی') {
    return newRemittance.value.amount !== null && newRemittance.value.amount > 0;
  } else {
    return newRemittance.value.coin_count !== null && newRemittance.value.coin_count > 0;
  }
});

// تاریخ شمسی فعلی
const persianDate = computed(() => {
  return moment().format('dddd jD jMMMM jYYYY');
});

// ==================== Helper Functions ====================
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

const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '۰';
  if (num === 0) return '۰';
  return toPersianNumber(num.toLocaleString('en-US'));
};

// فرمت وزن - حذف اعشار اگر صفر باشد
const formatWeight = (weight: number | null | undefined): string => {
  if (!weight && weight !== 0) return '۰';
  
  // اگر اعشار دارد و برابر با 0 است، فقط عدد صحیح نمایش داده شود
  const rounded = Math.round(weight * 1000) / 1000;
  const str = rounded.toString();
  
  if (str.includes('.')) {
    const parts = str.split('.');
    const decimalPart = parts[1].replace(/0+$/, '');
    
    if (decimalPart.length === 0) {
      // اگر اعشار صفر بود، فقط عدد صحیح نمایش بده
      return toPersianNumber(parseInt(parts[0]).toLocaleString('en-US'));
    } else {
      // اگر اعشار غیر صفر بود، با اعشار نمایش بده
      const integerPart = parseInt(parts[0]).toLocaleString('en-US');
      const result = `${integerPart}.${decimalPart}`;
      return toPersianNumber(result);
    }
  }
  
  return toPersianNumber(parseInt(str).toLocaleString('en-US'));
};

const formatAmount = (item: any): string => {
  if (item.type === 'وزنی') {
    return formatWeight(item.weight) + ' گرم';
  } else if (item.type === 'ریالی') {
    return formatNumber(item.amount) + ' ریال';
  } else {
    return formatNumber(item.coin_count) + ' عدد سکه';
  }
};

const getTypeIcon = (type: string): string => {
  switch(type) {
    case 'وزنی': return '🥇';
    case 'ریالی': return '💰';
    case 'سکه': return '🪙';
    default: return '📦';
  }
};

const getTypeClass = (type: string): string => {
  switch(type) {
    case 'وزنی': return 'weight';
    case 'ریالی': return 'rial';
    case 'سکه': return 'coin';
    default: return 'default';
  }
};

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    'در حال بررسی': 'pending',
    'تأییدشده': 'approved',
    'ردشده': 'rejected',
    'تحویل شده': 'delivered'
  };
  return classes[status] || 'pending';
};

// ==================== Date Functions ====================
const onDateSelect = (value: string) => {
  if (value) {
    const gregorianDate = moment(value, 'jYYYY-jMM-jDD').format('YYYY-MM-DD');
    selectedDate.value = gregorianDate;
    currentPage.value = 1;
    loadRemittances();
  } else {
    selectedDate.value = '';
    currentPage.value = 1;
    loadRemittances();
  }
};

const filterRemittances = () => {
  // فیلتراسیون در computed انجام می‌شود
};

// ==================== Weight Validation Functions ====================
const handleWeightInput = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value;
  
  let newValue = '';
  let dotCount = 0;
  
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char >= '0' && char <= '9') {
      newValue += char;
    } else if (char === '.' && dotCount === 0) {
      newValue += char;
      dotCount++;
    }
  }
  
  value = newValue;
  
  const parts = value.split('.');
  if (parts.length === 2 && parts[1].length > 3) {
    value = parts[0] + '.' + parts[1].substring(0, 3);
    weightError.value = 'حداکثر 3 رقم اعشار مجاز است';
    setTimeout(() => { weightError.value = ''; }, 2000);
  } else {
    weightError.value = '';
  }
  
  const numValue = parseFloat(value);
  if (numValue > 999.999) {
    value = '999.999';
    weightError.value = 'وزن نمی‌تواند بیشتر از 999.999 گرم باشد';
    setTimeout(() => { weightError.value = ''; }, 2000);
  }
  
  weightInputValue.value = value;
  
  if (value && !value.endsWith('.')) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      newRemittance.value.weight = num;
    }
  } else {
    newRemittance.value.weight = null;
  }
};

const handleWeightKeydown = (event: KeyboardEvent) => {
  const input = event.target as HTMLInputElement;
  const value = input.value;
  const key = event.key;
  
  const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', 
                       'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                       'Home', 'End', 'Tab'];
  
  if (!allowedKeys.includes(key) && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    return;
  }
  
  if (key === '.' && value.includes('.')) {
    event.preventDefault();
    return;
  }
  
  if (value.includes('.')) {
    const parts = value.split('.');
    const cursorPos = input.selectionStart || 0;
    const dotPos = value.indexOf('.');
    
    if (cursorPos > dotPos) {
      const decimalLength = parts[1].length;
      if (decimalLength >= 3 && /[0-9]/.test(key)) {
        event.preventDefault();
        weightError.value = 'حداکثر 3 رقم اعشار مجاز است';
        setTimeout(() => { weightError.value = ''; }, 2000);
        return;
      }
    }
  }
};

const handleWeightBlur = () => {
  if (weightInputValue.value) {
    const num = parseFloat(weightInputValue.value);
    if (!isNaN(num)) {
      weightInputValue.value = num.toFixed(3);
      newRemittance.value.weight = num;
    } else {
      weightInputValue.value = '';
      newRemittance.value.weight = null;
    }
  }
};

// ==================== Persian Name Validation ====================
const validatePersianName = (event: Event) => {
  const input = event.target as HTMLInputElement;
  let value = input.value;
  const persianRegex = /^[\u0600-\u06FF\uFB8A\u067E\u0686\u06AF\u200C\u200E\u200F\s\.]*$/;
  
  if (!persianRegex.test(value)) {
    value = value.replace(/[^\u0600-\u06FF\uFB8A\u067E\u0686\u06AF\u200C\u200E\u200F\s\.]/g, '');
    newRemittance.value.recipient = value;
    input.value = value;
  }
};

// ==================== Notification Functions ====================
const showNotification = (title: string, message: string, icon: string = '📦') => {
  if (notification.value.timeout) clearTimeout(notification.value.timeout);
  notification.value = { show: true, title, message, icon, timeout: null };
  notification.value.timeout = setTimeout(() => {
    notification.value.show = false;
  }, 5000);
};

const closeNotification = () => {
  if (notification.value.timeout) clearTimeout(notification.value.timeout);
  notification.value.show = false;
};

// ==================== API Functions ====================
const loadRemittances = async () => {
  loadingRemittances.value = true;
  try {
    let url = `/remittances/user?page=${currentPage.value}&limit=${limit.value}`;
    if (selectedDate.value) {
      url += `&date=${selectedDate.value}`;
    }
    
    console.log('📤 Fetching remittances:', url);
    const response = await api.get(url);
    
    if (response.data.success) {
      remittances.value = response.data.data || [];
      totalCount.value = response.data.pagination?.total || remittances.value.length;
      console.log('✅ Loaded remittances:', remittances.value.length);
    }
  } catch (err: any) {
    console.error('Error loading remittances:', err);
    if (err.response?.status === 401) {
      router.push('/login');
    } else {
      showNotification('❌ خطا', 'خطا در دریافت حواله‌ها', '❌');
    }
  } finally {
    loadingRemittances.value = false;
  }
};

const createRemittance = async () => {
  if (!isFormValid.value) return;
  
  loading.value = true;
  try {
    const data: any = {
      type: newRemittance.value.type,
      recipient: newRemittance.value.recipient.trim(),
      description: newRemittance.value.description || undefined
    };
    
    if (newRemittance.value.type === 'وزنی') {
      data.weight = parseFloat(newRemittance.value.weight!.toFixed(3));
    } else if (newRemittance.value.type === 'ریالی') {
      data.amount = newRemittance.value.amount;
    } else {
      data.coin_count = newRemittance.value.coin_count;
    }
    
    console.log('📤 Creating remittance:', data);
    const response = await api.post('/remittances', data);
    
    if (response.data.success) {
      resetForm();
      await loadRemittances();
      showNotification('✅ حواله ثبت شد', 'حواله شما با موفقیت ثبت شد', '✅');
    }
  } catch (err: any) {
    console.error('Error creating remittance:', err);
    const errorMsg = err.response?.data?.error || 'خطا در ثبت حواله';
    showNotification('❌ خطا', errorMsg, '❌');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  newRemittance.value = {
    type: 'وزنی',
    weight: null,
    amount: null,
    coin_count: null,
    recipient: '',
    description: ''
  };
  weightInputValue.value = '';
  weightError.value = '';
};

const refreshData = async () => {
  await loadRemittances();
  showNotification('🔄 بروزرسانی', 'لیست حواله‌ها بروزرسانی شد', '🔄');
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadRemittances();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    loadRemittances();
  }
};

// ==================== WebSocket ====================
const initSocket = () => {
  const socketClient = connectSocket();
  socket = socketClient;
  
  if (user.value?.id) {
    socketClient.emit('join-user', String(user.value.id));
  }
  
  socketClient.on('connect', () => {
    console.log('🔌 Socket connected');
    isSocketConnected.value = true;
  });
  
  socketClient.on('remittance_status_update', (data: any) => {
    console.log('📦 Real-time remittance status update:', data);
    if (String(data.user_id) === String(user.value?.id)) {
      const index = remittances.value.findIndex(r => r.id === data.id);
      if (index !== -1) {
        remittances.value[index].status = data.status;
        remittances.value[index].updated_at = data.updated_at;
        lastChangedId.value = data.id;
        setTimeout(() => { lastChangedId.value = null; }, 1000);
        showNotification('🔄 تغییر وضعیت', `وضعیت حواله به "${data.status}" تغییر یافت`, '🔄');
      } else {
        loadRemittances();
      }
    }
  });
  
  socketClient.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
    isSocketConnected.value = false;
  });
  
  socketClient.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error);
    isSocketConnected.value = false;
  });
};

// ==================== Sidebar Functions ====================
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

// ==================== Swipe Functions ====================
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

// ==================== Watch ====================
watch(statusFilter, () => {
  // فیلتر در computed انجام می‌شود
});

// ==================== Lifecycle ====================
onMounted(() => {
  console.log('📱 RemittancesView mounted');
  handleResize();
  loadRemittances();
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

const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) isSidebarOpen.value = false;
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.remittances-container {
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

/* فرم ثبت حواله */
.create-card {
  margin: 0 24px 24px 24px;
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #667eea;
}

.card-icon {
  font-size: 24px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
  flex: 1;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.full-width {
  grid-column: span 2;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
  font-size: 13px;
}

.required {
  color: #e74c3c;
}

.hint {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.error-hint {
  font-size: 11px;
  color: #e74c3c;
  margin-top: 4px;
}

.weight-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.weight-input-wrapper .form-input {
  flex: 1;
  padding-right: 50px;
}

.weight-unit {
  position: absolute;
  left: 12px;
  color: #999;
  font-size: 12px;
  direction: ltr;
}

.form-input, .form-select, .form-textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39,174,96,0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
}

/* فیلترها */
.filters-card {
  margin: 0 24px 24px 24px;
  background: white;
  border-radius: 20px;
  padding: 16px 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.date-filter-group {
  flex: 1;
  min-width: 180px;
}

.date-picker-container {
  width: 100%;
}

.date-picker-container :deep(.vpd-picker) {
  width: 100%;
}

.date-picker-container :deep(.vpd-input) {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  background: white;
  width: 100%;
  font-family: inherit;
  text-align: center;
  cursor: pointer;
}

.filter-select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  background: white;
  min-width: 150px;
  cursor: pointer;
}

.btn-refresh {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-2px);
}

/* لودینگ */
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

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 8px;
}

/* لیست حواله‌ها */
.remittances-list {
  margin: 0 24px 16px 24px;
}

.remittance-card {
  background: white;
  border-radius: 20px;
  padding: 18px 20px;
  margin-bottom: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  border-right: 4px solid;
}

.remittance-card.status-pending {
  border-right-color: #f59e0b;
  background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
}

.remittance-card.status-approved {
  border-right-color: #22c55e;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
}

.remittance-card.status-rejected {
  border-right-color: #ef4444;
  background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
}

.remittance-card.status-delivered {
  border-right-color: #3498db;
  background: linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%);
}

.status-changed {
  animation: statusFlash 0.5s ease-in-out;
}

@keyframes statusFlash {
  0%, 100% { background: transparent; }
  50% { background: #fff3e0; }
}

.card-header {
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
  gap: 10px;
  flex-wrap: wrap;
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

.transaction-time {
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
}

.transaction-date {
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.remittance-type-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.type-weight {
  background: #27ae60;
  color: white;
}

.type-rial {
  background: #3498db;
  color: white;
}

.type-coin {
  background: #f39c12;
  color: white;
}

.remittance-recipient {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
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

.status-badge.status-delivered {
  background: #e3f2fd;
  color: #1976d2;
}

.status-badge.status-delivered .status-dot {
  background: #3498db;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.card-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, #e2e8f0, transparent);
  margin: 12px 0;
}

.card-description {
  padding: 4px 0;
}

.description-text {
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
  display: block;
  word-wrap: break-word;
}

.description-text strong {
  color: #1e293b;
  font-weight: 700;
}

.description-separator {
  color: #cbd5e1;
  margin: 0 4px;
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

/* صفحه‌بندی */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin: 24px 24px 40px;
}

.page-btn {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 10px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
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

/* اعلان */
.notification-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  border-right: 4px solid #27ae60;
  cursor: pointer;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateX(100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.notification-icon {
  font-size: 28px;
}

.notification-text strong {
  display: block;
  font-size: 14px;
  color: #333;
}

.notification-text p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.notification-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
  padding: 4px;
}

.notification-close:hover {
  color: #333;
}

/* تقویم شمسی */
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
}

/* ریسپانسیو */
@media (max-width: 768px) {
  .header-container { padding: 0 16px; height: 70px; }
  .user-role-header { font-size: 16px; }
  .user-name-header { font-size: 11px; }
  .divider-section { margin: 12px 16px 20px; gap: 12px; }
  .date-box { padding: 6px 16px; }
  .date-text { font-size: 11px; }
  
  .create-card { margin: 0 16px 16px 16px; padding: 16px; }
  .filters-card { margin: 0 16px 16px 16px; padding: 12px 16px; }
  .form-row { grid-template-columns: 1fr; }
  .full-width { grid-column: span 1; }
  .filters-row { flex-direction: column; align-items: stretch; }
  .date-filter-group { min-width: auto; }
  .remittances-list { margin: 0 16px 12px 16px; }
  .remittance-card { padding: 14px 16px; }
  .date-time-group { padding: 3px 8px; gap: 6px; }
  .transaction-time { font-size: 9px; }
  .transaction-date { font-size: 9px; }
  .remittance-type-badge { padding: 3px 10px; font-size: 11px; }
  .remittance-recipient { font-size: 12px; }
  .status-badge { padding: 3px 8px; font-size: 10px; }
  .description-text { font-size: 11px; }
  .pagination { margin: 20px 16px 32px; }
  .page-btn { padding: 8px 18px; font-size: 12px; }
  .loading-state { margin: 0 16px; padding: 40px; }
  .empty-state { padding: 40px; }
  .empty-icon { font-size: 36px; }
}
</style>