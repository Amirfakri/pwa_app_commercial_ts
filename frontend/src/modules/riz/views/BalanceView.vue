<template>
  <div class="user-balance-page" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <!-- هدر مثل صفحه حوالجات -->
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
                <span class="user-name-header">{{ userBalance?.user?.full_name || userBalance?.user?.mobile_number || user?.full_name || user?.mobile_number }}</span>
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

    <!-- خط تاریخ مثل صفحه حوالجات -->
    <div class="divider-section">
      <div class="divider-line"></div>
      <div class="date-box">
        <span class="date-text">{{ persianDate }}</span>
      </div>
      <div class="divider-line"></div>
    </div>

    <!-- کارت‌های مانده حساب -->
    <div v-if="userBalance" class="balance-cards">
      <div class="balance-card">
        <div class="card-header">
          <h3>موجودی ریالی</h3>
        </div>
        <div class="card-body">
          <div class="balance-amount" :class="getBalanceClass(userBalance.balance?.rial || 0)">
            {{ formatRialNoUnit(userBalance.balance?.rial || 0) }}
          </div>
        </div>
      </div>

      <div class="balance-card">
        <div class="card-header">
          <h3>موجودی طلا</h3>
        </div>
        <div class="card-body">
          <div class="balance-amount" :class="getBalanceClass(userBalance.balance?.gold || 0)">
            {{ formatWeightNoSign(userBalance.balance?.gold || 0) }}
          </div>
        </div>
      </div>
    </div>

    <!-- اطلاعات کاربر -->
    <div v-if="userBalance" class="user-info-card">
      <div class="info-header">
        <h3>اطلاعات کاربر</h3>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">کد کاربری:</span>
          <span class="value">{{ userBalance.user?.code || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">نام و نام خانوادگی:</span>
          <span class="value">{{ userBalance.user?.full_name || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">شماره موبایل:</span>
          <span class="value">{{ userBalance.user?.mobile_number || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">تعداد تراکنش‌ها:</span>
          <span class="value">{{ formatNumber(userBalance.total_transactions || 0) }}</span>
        </div>
      </div>
      
      <!-- آخرین بروزرسانی از آخرین تراکنش -->
      <div class="last-update-section">
        <div class="last-update-item">
          <span class="last-update-label">آخرین بروزرسانی:</span>
          <span class="last-update-value">{{ lastUpdateTime }}</span>
        </div>
      </div>
    </div>

    <!-- لیست تراکنش‌ها -->
    <div class="transactions-section" v-if="userBalance">
      <div class="section-header">
        <h2>لیست تراکنش‌ها</h2>
        <span class="total-badge">تعداد: {{ formatNumber(transactionPagination.total) }}</span>
      </div>

      <div v-if="loadingTransactions" class="loading-state">
        <div class="spinner"></div>
        <p>در حال بارگذاری تراکنش‌ها...</p>
      </div>

      <div v-else-if="transactions.length === 0" class="empty-state">
        <div class="empty-content">
          <span class="empty-icon">📭</span>
          <p>هیچ تراکنشی یافت نشد</p>
          <p class="empty-hint">هنوز تراکنشی برای شما ثبت نشده است.</p>
        </div>
      </div>

      <!-- کارت‌های تراکنش -->
      <div v-else class="transactions-cards">
        <div v-for="tx in transactions" :key="tx.id" class="transaction-card">
          <div class="card-header-row">
            <div class="doc-number">
              <span class="label">شماره سند:</span>
              <span class="value">{{ tx.document_no || '-' }}</span>
            </div>
            <div class="date">
              <span class="label">تاریخ:</span>
              <span class="value">{{ formatPersianDate(tx.date) }}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="description-section">
            <div class="description">
              <span class="label">شرح:</span>
              <span class="value">{{ getFormattedDescription(tx) }}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div v-if="hasChanges(tx)" class="changes-wrapper">
            <div v-if="hasGoldChanges(tx)" class="changes-box gold-box">
              <div class="changes-row">
                <div v-if="tx.weight_debit > 0" class="change-item debit">
                  <span class="change-label">بدهکار طلا:</span>
                  <span class="change-value">{{ formatWeightWithUnit(tx.weight_debit) }}</span>
                </div>
                <div v-if="tx.weight_credit > 0" class="change-item credit">
                  <span class="change-label">بستانکار طلا:</span>
                  <span class="change-value">{{ formatWeightWithUnit(tx.weight_credit) }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="hasRialChanges(tx)" class="changes-box rial-box">
              <div class="changes-row">
                <div v-if="tx.debit_amount > 0" class="change-item debit">
                  <span class="change-label">بدهکار ریال:</span>
                  <span class="change-value">{{ formatRialWithUnit(tx.debit_amount) }}</span>
                </div>
                <div v-if="tx.credit_amount > 0" class="change-item credit">
                  <span class="change-label">بستانکار ریال:</span>
                  <span class="change-value">{{ formatRialWithUnit(tx.credit_amount) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="separator-line"></div>
          
          <div class="balances-wrapper">
            <div class="balances-row">
              <div class="balance-item">
                <span class="balance-label">مانده طلا:</span>
                <span class="balance-value" :class="getBalanceClass(tx.balance_weight)">
                  {{ formatWeightNoSign(tx.balance_weight) }}
                </span>
              </div>
              <div class="balance-divider"></div>
              <div class="balance-item">
                <span class="balance-label">مانده ریال:</span>
                <span class="balance-value" :class="getBalanceClass(tx.balance_amount)">
                  {{ formatRialNoUnit(tx.balance_amount) }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="card-actions">
            <button @click="viewTransactionDetails(tx)" class="btn-detail">
              مشاهده جزئیات
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-controls" v-if="transactionPagination.total > transactionPagination.limit">
        <div class="pagination-info">
          صفحه {{ toPersianNumber(transactionPagination.page) }} از {{ toPersianNumber(totalPages) }}
          ({{ formatNumber(transactionPagination.total) }} تراکنش)
        </div>
        <div class="pagination-buttons">
          <button 
            class="pagination-button"
            @click="goToPage(transactionPagination.page - 1)"
            :disabled="transactionPagination.page === 1 || loadingTransactions"
          >
            قبلی
          </button>
          <button 
            class="pagination-button"
            @click="goToPage(transactionPagination.page + 1)"
            :disabled="!transactionPagination.hasMore || loadingTransactions"
          >
            بعدی
          </button>
        </div>
      </div>
    </div>

    <!-- مودال جزئیات رکورد -->
    <div v-if="detailDialog.open" class="modal-overlay" @click.self="closeDetailDialog">
      <div class="modal-container detail-modal">
        <div class="modal-header">
          <div class="modal-header-content">
            <h3>جزئیات کامل تراکنش</h3>
          </div>
          <button @click="closeDetailDialog" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="detailDialog.record" class="detail-grid">
            <div class="detail-item">
              <label>شماره سند:</label>
              <span>{{ detailDialog.record.document_no || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>تاریخ:</label>
              <span>{{ formatDateTimeFull(detailDialog.record.date) }}</span>
            </div>
            <div class="detail-item-full">
              <label>شرح اصلی:</label>
              <span class="description-text">{{ detailDialog.record.description || '-' }}</span>
            </div>
            <div class="detail-item-full">
              <label>شرح فرمت شده:</label>
              <span class="description-text formatted">{{ getFormattedDescription(detailDialog.record) }}</span>
            </div>
            
            <div class="detail-section">
              <h4>اطلاعات طلایی</h4>
              <div class="detail-row">
                <div class="detail-item">
                  <label>عیار:</label>
                  <span>{{ formatNumber(detailDialog.record.rate) }}</span>
                </div>
                <div class="detail-item">
                  <label>وزن اولیه:</label>
                  <span>{{ formatWeightWithUnit(detailDialog.record.weight) }}</span>
                </div>
                <div class="detail-item">
                  <label>وزن بدهکار:</label>
                  <span class="debit">{{ formatWeightWithUnit(detailDialog.record.weight_debit) }}</span>
                </div>
                <div class="detail-item">
                  <label>وزن بستانکار:</label>
                  <span class="credit">{{ formatWeightWithUnit(detailDialog.record.weight_credit) }}</span>
                </div>
                <div class="detail-item">
                  <label>مانده وزن:</label>
                  <span :class="getBalanceClass(detailDialog.record.balance_weight)">
                    {{ formatWeightNoSign(detailDialog.record.balance_weight) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>اطلاعات ریالی</h4>
              <div class="detail-row">
                <div class="detail-item">
                  <label>بدهی ریالی:</label>
                  <span class="debit">{{ formatRialWithUnit(detailDialog.record.debit_amount) }}</span>
                </div>
                <div class="detail-item">
                  <label>بستانکاری ریالی:</label>
                  <span class="credit">{{ formatRialWithUnit(detailDialog.record.credit_amount) }}</span>
                </div>
                <div class="detail-item">
                  <label>مانده ریالی:</label>
                  <span :class="getBalanceClass(detailDialog.record.balance_amount)">
                    {{ formatRialNoUnit(detailDialog.record.balance_amount) }}
                  </span>
                </div>
                <div class="detail-item">
                  <label>اجرت:</label>
                  <span>{{ formatRialWithUnit(detailDialog.record.wage) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeDetailDialog" class="btn-close-modal">بستن</button>
        </div>
      </div>
    </div>

    <!-- سایدبار منو مثل صفحه حوالجات -->
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
          <span class="sidebar-user-name">{{ userBalance?.user?.full_name || userBalance?.user?.mobile_number }}</span>
          <div class="user-phone-divider">
            <span class="sidebar-user-phone">{{ userBalance?.user?.mobile_number }}</span>
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

    <!-- لودینگ اولیه -->
    <div v-if="initialLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>در حال بارگذاری اطلاعات...</p>
    </div>

    <!-- اعلان خطا -->
    <div v-if="showError" class="notification-toast" @click="closeErrorToast">
      <div class="notification-content">
        <span class="notification-icon">❌</span>
        <div class="notification-text">
          <strong>خطا</strong>
          <p>{{ errorMessage }}</p>
        </div>
        <button class="notification-close" @click.stop="closeErrorToast">✕</button>
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
import moment from 'moment-jalaali';

moment.loadPersian({ dialect: 'persian-modern' });

const router = useRouter();
const authStore = useAuthStore();
const user = computed(() => authStore.user);

// ==================== Types ====================
interface Transaction {
  id: number;
  user_code: string;
  document_no: string;
  invoice_no: string | null;
  date: string | null;
  description: string | null;
  weight: number | null;
  weight_debit: number;
  weight_credit: number;
  rate: number | null;
  wage: number;
  balance_weight: number;
  debit_amount: number;
  credit_amount: number;
  balance_amount: number;
  updated_at?: string;
  created_at: string;
}

interface UserBalance {
  user: {
    code: string;
    full_name: string;
    mobile_number: string;
  };
  balance: {
    rial: number;
    gold: number;
    last_update: string;
    last_document: string;
  };
  total_transactions: number;
}

// ==================== State ====================
const userBalance = ref<UserBalance | null>(null);
const transactions = ref<Transaction[]>([]);
const loading = ref(false);
const loadingTransactions = ref(false);
const initialLoading = ref(true);
const lastUpdateTime = ref<string>('');
const errorMessage = ref<string>('');
const showError = ref(false);
const isSidebarOpen = ref(false);
const isMobile = ref(window.innerWidth < 768);
const isSocketConnected = ref(false);

let socket: any = null;
let touchStartX = 0;

const transactionPagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  hasMore: false
});

const detailDialog = ref<{ open: boolean; record: Transaction | null }>({ open: false, record: null });

// ==================== Computed ====================
const totalPages = computed(() => {
  return Math.ceil(transactionPagination.value.total / transactionPagination.value.limit);
});

// تاریخ شمسی فعلی
const persianDate = computed(() => {
  return moment().format('dddd jD jMMMM jYYYY');
});

// ==================== Socket Connection ====================
const initSocket = () => {
  if (socket) {
    socket.disconnect();
  }
  
  const socketClient = connectSocket();
  socket = socketClient;
  
  if (user.value?.id) {
    socketClient.emit('join-user', String(user.value.id));
  }
  
  socketClient.on('connect', () => {
    console.log('🔌 BalanceView Socket connected');
    isSocketConnected.value = true;
  });
  
  socketClient.on('disconnect', () => {
    console.log('🔌 BalanceView Socket disconnected');
    isSocketConnected.value = false;
  });
  
  socketClient.on('connect_error', (error: any) => {
    console.error('❌ BalanceView Socket connection error:', error);
    isSocketConnected.value = false;
  });
  
  socketClient.on('transaction_update', (data: any) => {
    console.log('📊 Transaction update received:', data);
    if (String(data.user_code) === String(user.value?.code || userBalance.value?.user?.code)) {
      loadMyTransactions(1, false);
      loadMyBalance();
    }
  });
};

// ==================== Helper Functions ====================
const hasChanges = (tx: Transaction): boolean => {
  return hasGoldChanges(tx) || hasRialChanges(tx);
};

const hasGoldChanges = (tx: Transaction): boolean => {
  return (tx.weight_debit > 0 && tx.weight_debit !== null) || 
         (tx.weight_credit > 0 && tx.weight_credit !== null);
};

const hasRialChanges = (tx: Transaction): boolean => {
  return (tx.debit_amount > 0 && tx.debit_amount !== null) || 
         (tx.credit_amount > 0 && tx.credit_amount !== null);
};

// تبدیل اعداد انگلیسی به فارسی
const toPersianDigits = (num: string): string => {
  const persianDigits: { [key: string]: string } = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  return num.replace(/[0-9]/g, (d) => persianDigits[d]);
};

// فرمت عدد با جداکننده هزارگان
const formatNumberWithComma = (num: number | null | undefined, decimals: number = 0): string => {
  if (num === null || num === undefined || num === 0) return '۰';
  const absNum = Math.abs(num);
  const fixedNum = absNum.toFixed(decimals);
  const parts = fixedNum.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  const integerWithCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  let result = integerWithCommas;
  if (decimalPart && decimals > 0) {
    result += '.' + decimalPart;
  }
  return toPersianDigits(result);
};

// فرمت اعداد عادی (بدون واحد)
const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || num === 0) return '۰';
  return formatNumberWithComma(num, 0);
};

const toPersianNumber = (num: number): string => {
  return toPersianDigits(String(num));
};

// فرمت وزن طلا با واحد گرم (برای بدهکار/بستانکار)
const formatWeightWithUnit = (num: number | null | undefined): string => {
  if (num === null || num === undefined || num === 0) return '۰ گرم';
  const absNum = Math.abs(num);
  const formattedNum = formatNumberWithComma(absNum, 3);
  const sign = num < 0 ? '-' : '';
  return `${sign}${formattedNum} گرم`;
};

// فرمت وزن طلا بدون واحد (برای مانده)
const formatWeightNoSign = (num: number | null | undefined): string => {
  if (num === null || num === undefined || num === 0) return '۰';
  const absNum = Math.abs(num);
  return formatNumberWithComma(absNum, 3);
};

// فرمت ریال با واحد (برای بدهکار/بستانکار)
const formatRialWithUnit = (num: number | null | undefined): string => {
  if (num === null || num === undefined || num === 0) return '۰ ریال';
  const absNum = Math.abs(num);
  const formattedNum = formatNumberWithComma(absNum, 0);
  const sign = num < 0 ? '-' : '';
  return `${sign}${formattedNum} ریال`;
};

// فرمت ریال بدون واحد (برای مانده)
const formatRialNoUnit = (num: number | null | undefined): string => {
  if (num === null || num === undefined || num === 0) return '۰';
  const absNum = Math.abs(num);
  return formatNumberWithComma(absNum, 0);
};

// فرمت تاریخ شمسی
const formatPersianDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return moment(date).format('jYYYY-jMM-jDD');
    }
    return dateString;
  } catch {
    return dateString;
  }
};

// فرمت تاریخ و ساعت شمسی کامل
const formatPersianDateTime = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return moment(date).format('jYYYY-jMM-jDD HH:mm:ss');
    }
    return dateString;
  } catch {
    return dateString;
  }
};

const formatDateTimeFull = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return moment(date).format('jYYYY-jMM-jDD HH:mm:ss');
    }
    return dateString;
  } catch {
    return dateString;
  }
};

const getBalanceClass = (balance: number): string => {
  if (balance > 0) return 'credit-positive';
  if (balance < 0) return 'debit-negative';
  return 'balance-zero';
};

// به‌روزرسانی آخرین زمان از آخرین تراکنش
const updateLastUpdateTime = () => {
  if (transactions.value.length > 0) {
    const lastTransaction = transactions.value[0];
    const lastUpdate = lastTransaction.updated_at || lastTransaction.created_at;
    
    if (lastUpdate) {
      lastUpdateTime.value = formatPersianDateTime(lastUpdate);
    } else {
      lastUpdateTime.value = formatPersianDateTime(new Date().toISOString());
    }
  } else {
    lastUpdateTime.value = formatPersianDateTime(new Date().toISOString());
  }
};

// ==================== فرمت کردن شرح تراکنش ====================
const formatDescription = (transaction: Transaction): string => {
  const originalDescription = transaction.description || '';
  const weight = transaction.weight;
  const weightDebit = transaction.weight_debit;
  const weightCredit = transaction.weight_credit;
  const rate = transaction.rate;
  const debitAmount = transaction.debit_amount;
  const creditAmount = transaction.credit_amount;
  
  const isDiscount = originalDescription.includes('تخفیف');
  const isBadHawaleh = originalDescription.includes('بد-حواله') || originalDescription.includes('بد حواله');
  const isBesHawaleh = originalDescription.includes('بس-حواله') || originalDescription.includes('بس حواله');
  const isBuyGold = originalDescription.includes('خريد پولي') || originalDescription.includes('خرید پولی');
  const isSellGold = originalDescription.includes('فروش پولي') || originalDescription.includes('فروش پولی');
  const isMoteFarreghB = originalDescription.includes('ب- متفرقه');
  const isMoteFarreghD = originalDescription.includes('د- متفرقه');
  const isDAbShodeh = originalDescription.includes('د- ابشده');
  const isBAbShodeh = originalDescription.includes('ب- ابشده');
  
  const hasWeight = (weight && weight > 0) || (weightDebit && weightDebit > 0) || (weightCredit && weightCredit > 0);
  const hasAmount = (debitAmount > 0) || (creditAmount > 0);
  const displayWeight = weight || weightDebit || weightCredit;
  const displayAmount = debitAmount > 0 ? debitAmount : creditAmount;
  
  const receiptMatch = originalDescription.match(/ر\((\d+)\)/);
  const receiptNumber = receiptMatch ? receiptMatch[1] : '';
  
  const hasFaramarzi = originalDescription.includes('فرامرزي');
  
  if (isDiscount) {
    if (debitAmount > 0) {
      let result = `تخفیف از شما به مبلغ ${formatRialWithUnit(debitAmount)}`;
      if (hasWeight && displayWeight) {
        result += ` و وزن ${formatWeightWithUnit(displayWeight)}`;
      }
      return result;
    } else if (creditAmount > 0) {
      let result = `تخفیف به شما به مبلغ ${formatRialWithUnit(creditAmount)}`;
      if (hasWeight && displayWeight) {
        result += ` و وزن ${formatWeightWithUnit(displayWeight)}`;
      }
      return result;
    }
  }
  
  if (isBadHawaleh) {
    if (hasWeight && displayWeight) {
      return `دریافت حواله به وزن ${formatWeightWithUnit(displayWeight)}`;
    } else if (hasAmount && displayAmount) {
      return `دریافت حواله به مبلغ ${formatRialWithUnit(displayAmount)}`;
    }
    return 'دریافت حواله';
  }
  
  if (isBesHawaleh) {
    if (hasWeight && displayWeight) {
      return `پرداخت حواله به وزن ${formatWeightWithUnit(displayWeight)}`;
    } else if (hasAmount && displayAmount) {
      return `پرداخت حواله به مبلغ ${formatRialWithUnit(displayAmount)}`;
    }
    return 'پرداخت حواله';
  }
  
  if (isBuyGold) {
    const match = originalDescription.match(/خرید پولي\s+(.+?)\s+قطعي/);
    let middlePart = '';
    if (match && match[1]) {
      middlePart = match[1];
    }
    
    let result = 'خرید پولي';
    if (middlePart) {
      result += ` ${middlePart}`;
    }
    result += ' قطعي';
    if (hasWeight && displayWeight) {
      result += ` به وزن ${formatWeightWithUnit(displayWeight)}`;
    }
    if (hasAmount && displayAmount) {
      result += ` به مبلغ ${formatRialWithUnit(displayAmount)}`;
    }
    return result;
  }
  
  if (isSellGold) {
    const match = originalDescription.match(/فروش پولي\s+(.+?)\s+قطعي/);
    let middlePart = '';
    if (match && match[1]) {
      middlePart = match[1];
    }
    
    let result = 'فروش پولي';
    if (middlePart) {
      result += ` ${middlePart}`;
    }
    result += ' قطعي';
    if (hasWeight && displayWeight) {
      result += ` به وزن ${formatWeightWithUnit(displayWeight)}`;
    }
    if (hasAmount && displayAmount) {
      result += ` به مبلغ ${formatRialWithUnit(displayAmount)}`;
    }
    return result;
  }
  
  if (isDAbShodeh) {
    let result = 'دریافت آبشده قطعي';
    if (receiptNumber) {
      result += ` -ر(${receiptNumber})`;
    }
    if (hasFaramarzi) {
      result += ' فرامرزي';
    }
    if (weight && weight > 0) {
      result += ` به وزن اولیه ${formatWeightWithUnit(weight)}`;
    }
    if (rate && rate > 0) {
      result += ` به عیار ${formatNumber(rate)}`;
    }
    if (weightCredit && weightCredit > 0) {
      result += ` و به وزن ثانویه ${formatWeightWithUnit(weightCredit)}`;
    } else if (weightDebit && weightDebit > 0) {
      result += ` و به وزن ثانویه ${formatWeightWithUnit(weightDebit)}`;
    }
    result += ' به عیار ۷۵۰';
    if (hasAmount && displayAmount) {
      result += ` به مبلغ ${formatRialWithUnit(displayAmount)}`;
    }
    return result;
  }
  
  if (isBAbShodeh) {
    let result = 'پرداخت آبشده قطعي';
    if (receiptNumber) {
      result += ` -ر(${receiptNumber})`;
    }
    if (hasFaramarzi) {
      result += ' فرامرزي';
    }
    if (weight && weight > 0) {
      result += ` به وزن اولیه ${formatWeightWithUnit(weight)}`;
    }
    if (rate && rate > 0) {
      result += ` به عیار ${formatNumber(rate)}`;
    }
    if (weightDebit && weightDebit > 0) {
      result += ` و به وزن ثانویه ${formatWeightWithUnit(weightDebit)}`;
    } else if (weightCredit && weightCredit > 0) {
      result += ` و به وزن ثانویه ${formatWeightWithUnit(weightCredit)}`;
    }
    result += ' به عیار ۷۵۰';
    if (hasAmount && displayAmount) {
      result += ` به مبلغ ${formatRialWithUnit(displayAmount)}`;
    }
    return result;
  }
  
  if (isMoteFarreghB) {
    let result = 'پرداخت متفرقه';
    if (receiptNumber) {
      result += ` -ر(${receiptNumber})`;
    }
    if (weight && weight > 0) {
      result += ` به وزن اولیه ${formatWeightWithUnit(weight)}`;
    }
    if (rate && rate > 0) {
      result += ` به عیار ${formatNumber(rate)}`;
    }
    if (weightDebit && weightDebit > 0) {
      result += ` به وزن ثانویه ${formatWeightWithUnit(weightDebit)}`;
    } else if (weightCredit && weightCredit > 0) {
      result += ` به وزن ثانویه ${formatWeightWithUnit(weightCredit)}`;
    }
    result += ' به عیار ۷۵۰';
    if (hasAmount && displayAmount) {
      result += ` به مبلغ ${formatRialWithUnit(displayAmount)}`;
    }
    return result;
  }
  
  if (isMoteFarreghD) {
    let result = 'دریافت متفرقه';
    if (receiptNumber) {
      result += ` -ر(${receiptNumber})`;
    }
    if (weight && weight > 0) {
      result += ` به وزن اولیه ${formatWeightWithUnit(weight)}`;
    }
    if (rate && rate > 0) {
      result += ` به عیار ${formatNumber(rate)}`;
    }
    if (weightCredit && weightCredit > 0) {
      result += ` به وزن ثانویه ${formatWeightWithUnit(weightCredit)}`;
    } else if (weightDebit && weightDebit > 0) {
      result += ` به وزن ثانویه ${formatWeightWithUnit(weightDebit)}`;
    }
    result += ' به عیار ۷۵۰';
    if (hasAmount && displayAmount) {
      result += ` به مبلغ ${formatRialWithUnit(displayAmount)}`;
    }
    return result;
  }
  
  return originalDescription;
};

const getFormattedDescription = (transaction: Transaction): string => {
  return formatDescription(transaction);
};

// ==================== API Functions ====================
const loadMyBalance = async () => {
  try {
    errorMessage.value = '';
    showError.value = false;
    const response = await api.get('/riz/my-balance');
    if (response.data.success && response.data.data) {
      userBalance.value = response.data.data;
      return true;
    }
    return false;
  } catch (err: any) {
    console.error('Error loading balance:', err);
    if (err.response?.status === 401) {
      router.push('/login');
    } else {
      errorMessage.value = err.response?.data?.message || 'خطا در دریافت اطلاعات مانده حساب';
      showError.value = true;
      setTimeout(() => { showError.value = false; }, 5000);
    }
    return false;
  }
};

const loadMyTransactions = async (page: number = 1, append: boolean = false) => {
  loadingTransactions.value = true;
  
  try {
    const limit = transactionPagination.value.limit;
    const response = await api.get('/riz/my-transactions', {
      params: { page, limit }
    });
    
    if (response.data.success) {
      let newData = response.data.data || [];
      
      if (append) {
        const existingIds = new Set(transactions.value.map(item => item.id));
        const uniqueNewData = newData.filter((item: Transaction) => !existingIds.has(item.id));
        transactions.value = [...transactions.value, ...uniqueNewData];
      } else {
        transactions.value = newData;
      }
      
      const total = response.data.pagination?.total || newData.length;
      const hasMore = response.data.pagination?.hasMore || false;
      
      transactionPagination.value = {
        page: page,
        limit: limit,
        total: total,
        hasMore: hasMore
      };
      
      updateLastUpdateTime();
    }
  } catch (err: any) {
    console.error('Error loading my transactions:', err);
    if (err.response?.status === 401) {
      router.push('/login');
    } else {
      errorMessage.value = err.response?.data?.message || 'خطا در دریافت لیست تراکنش‌ها';
      showError.value = true;
      setTimeout(() => { showError.value = false; }, 5000);
    }
  } finally {
    loadingTransactions.value = false;
  }
};

const goToPage = async (page: number) => {
  if (page < 1) return;
  if (page > transactionPagination.value.page && !transactionPagination.value.hasMore) return;
  
  if (page > transactionPagination.value.page) {
    await loadMyTransactions(page, true);
  } else if (page < transactionPagination.value.page) {
    await loadMyTransactions(page, false);
  }
};

const refreshData = async () => {
  loading.value = true;
  errorMessage.value = '';
  showError.value = false;
  
  try {
    await Promise.all([
      loadMyBalance(),
      loadMyTransactions(1, false)
    ]);
  } catch (err) {
    console.error('Error refreshing data:', err);
  } finally {
    loading.value = false;
  }
};

const viewTransactionDetails = (record: Transaction) => {
  detailDialog.value = { open: true, record };
};

const closeDetailDialog = () => {
  detailDialog.value = { open: false, record: null };
};

const closeErrorToast = () => {
  showError.value = false;
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

const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) isSidebarOpen.value = false;
};

// ==================== Watch ====================
watch(transactions, () => {
  updateLastUpdateTime();
}, { deep: true });

// ==================== Lifecycle ====================
onMounted(async () => {
  initialLoading.value = true;
  handleResize();
  
  if (user.value?.id) {
    initSocket();
  }
  
  const hasBalance = await loadMyBalance();
  if (hasBalance) {
    await loadMyTransactions(1, false);
  }
  initialLoading.value = false;
  window.addEventListener('resize', handleResize);
  document.addEventListener('touchstart', onTouchStart);
  document.addEventListener('touchmove', onTouchMove);
  document.addEventListener('touchend', onTouchEnd);
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
    socket = null;
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

.user-balance-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fb 0%, #eef2f6 100%);
  overflow-x: hidden;
}

/* ==================== هدر مثل صفحه حوالجات ==================== */
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

/* ==================== خط تاریخ مثل صفحه حوالجات ==================== */
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
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

/* ==================== کارت‌های مانده حساب ==================== */
.balance-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin: 0 24px 24px 24px;
}

.balance-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.balance-card .card-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e1e5e9;
}

.balance-card .card-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.card-body {
  padding: 24px;
  text-align: center;
}

.balance-amount {
  font-size: 36px;
  font-weight: bold;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  word-break: break-word;
  font-family: 'Vazirmatn', 'Vazir', 'IRANSans', 'PeydaWeb', Tahoma, sans-serif;
}

/* ==================== اطلاعات کاربر ==================== */
.user-info-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin: 0 24px 24px 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.info-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #667eea;
}

.info-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #f8f9fa;
  border-radius: 12px;
  gap: 8px;
}

.info-item .label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.info-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  font-family: 'Vazirmatn', 'Vazir', 'IRANSans', 'PeydaWeb', Tahoma, sans-serif;
}

/* آخرین بروزرسانی */
.last-update-section {
  border-top: 1px solid #e1e5e9;
  padding-top: 16px;
  margin-top: 4px;
}

.last-update-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f0fdf4;
  border-radius: 12px;
  border-right: 3px solid #27ae60;
}

.last-update-label {
  font-size: 15px;
  font-weight: 700;
  color: #166534;
}

.last-update-value {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  font-family: 'Vazirmatn', 'Vazir', 'IRANSans', 'PeydaWeb', Tahoma, sans-serif;
  direction: ltr;
}

/* ==================== تراکنش‌ها ==================== */
.transactions-section {
  margin: 0 24px 16px 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1a1a2e;
}

.total-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.transactions-cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.transaction-card {
  background: white;
  border-radius: 20px;
  padding: 20px 24px;
  transition: all 0.2s ease;
  border: 1px solid #e1e5e9;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.transaction-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  border-color: #667eea;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 16px;
  flex-wrap: wrap;
}

.doc-number, .date {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  white-space: nowrap;
}

.doc-number .label, .date .label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.doc-number .value, .date .value {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  font-family: 'Vazirmatn', 'Vazir', 'IRANSans', 'PeydaWeb', Tahoma, sans-serif;
}

.doc-number .value {
  color: #3498db;
  font-family: monospace;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e1e5e9, transparent);
  margin: 12px 0;
}

.separator-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
  margin: 16px 0 12px 0;
}

.description-section {
  margin: 12px 0;
}

.description {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.description .label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
  min-width: 50px;
}

.description .value {
  font-size: 15px;
  color: #2c3e50;
  line-height: 1.6;
  flex: 1;
  word-break: break-word;
}

.changes-wrapper {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.changes-box {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 12px 18px;
  transition: all 0.2s ease;
}

.changes-row {
  display: flex;
  justify-content: flex-start;
  gap: 40px;
  flex-wrap: wrap;
}

.change-item {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.change-label {
  font-size: 14px;
  font-weight: 500;
}

.change-value {
  font-size: 15px;
  font-weight: 700;
  font-family: 'Vazirmatn', 'Vazir', 'IRANSans', 'PeydaWeb', Tahoma, sans-serif;
}

.change-item.debit .change-label,
.change-item.debit .change-value {
  color: #dc2626;
}

.change-item.credit .change-label,
.change-item.credit .change-value {
  color: #2563eb;
}

.balances-wrapper {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 14px 18px;
  margin: 0;
  transition: all 0.2s ease;
}

.balances-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.balance-item {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.balance-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(180deg, transparent, #cbd5e1, transparent);
  flex-shrink: 0;
}

.balance-label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  flex-shrink: 0;
}

.balance-value {
  font-weight: 700;
  font-family: 'Vazirmatn', 'Vazir', 'IRANSans', 'PeydaWeb', Tahoma, sans-serif;
  text-align: left;
  direction: ltr;
  font-size: 20px;
  color: #1a1a2e;
  flex-shrink: 1;
  word-break: break-word;
  line-height: 1.3;
}

.balance-amount.credit-positive,
.balance-value.credit-positive {
  color: #2563eb;
}

.balance-amount.debit-negative,
.balance-value.debit-negative {
  color: #dc2626;
}

.balance-amount.balance-zero,
.balance-value.balance-zero {
  color: #94a3b8;
}

.card-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.btn-detail {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-detail:hover {
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(102,126,234,0.4);
}

/* ==================== صفحه‌بندی ==================== */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e1e5e9;
  flex-wrap: wrap;
  gap: 12px;
}

.pagination-info {
  font-size: 14px;
  color: #666;
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
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.pagination-button:hover:not(:disabled) {
  transform: scale(1.05);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==================== لودینگ ==================== */
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

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(240, 242, 245, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 2000;
}

/* ==================== حالت خالی ==================== */
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
  font-size: 15px;
}

.empty-hint {
  font-size: 13px;
  color: #cbd5e1;
  margin-top: 8px;
}

/* ==================== مودال ==================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 24px;
  width: 800px;
  max-width: 95%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0,0,0,0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateY(-50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px 24px 0 0;
}

.modal-header-content h3 {
  margin: 0;
  color: white;
  font-size: 18px;
}

.close-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-item-full {
  grid-column: span 2;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.detail-item label, .detail-item-full label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.detail-item span, .detail-item-full span {
  font-size: 15px;
  font-weight: 500;
  word-break: break-word;
  font-family: 'Vazirmatn', 'Vazir', 'IRANSans', 'PeydaWeb', Tahoma, sans-serif;
}

.detail-item span.debit { color: #dc2626; }
.detail-item span.credit { color: #2563eb; }

.description-text {
  word-break: break-word;
  white-space: pre-wrap;
}

.description-text.formatted {
  color: #0066cc;
  font-weight: 500;
}

.detail-section {
  grid-column: span 2;
  margin-top: 8px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.detail-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-close-modal {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-close-modal:hover {
  background: #7f8c8d;
  transform: translateY(-1px);
}

/* ==================== سایدبار مثل صفحه حوالجات ==================== */
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
  font-size: 13px;
  color: #64748b;
}

.nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  color: #475569;
  text-decoration: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s;
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

.sidebar-footer {
  flex-shrink: 0;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
}

.footer-text {
  text-align: center;
  font-size: 13px;
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
  transition: all 0.2s;
}

.logout-btn-sidebar:hover {
  background: #fee2e2;
}

/* ==================== اعلان خطا ==================== */
.notification-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  border-right: 4px solid #ef4444;
  cursor: pointer;
  z-index: 1000;
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
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
  font-size: 15px;
  color: #333;
}

.notification-text p {
  margin: 0;
  font-size: 13px;
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

/* ==================== ریسپانسیو ==================== */
@media (max-width: 768px) {
  .header-container { padding: 0 16px; height: 70px; }
  .user-role-header { font-size: 16px; }
  .user-name-header { font-size: 11px; }
  .divider-section { margin: 12px 16px 20px; gap: 12px; }
  .date-box { padding: 6px 16px; }
  .date-text { font-size: 13px; }
  
  .balance-cards { margin: 0 16px 16px 16px; gap: 16px; }
  .user-info-card { margin: 0 16px 16px 16px; padding: 16px; }
  .transactions-section { margin: 0 16px 12px 16px; }
  
  .balance-card .card-header { padding: 16px 20px; }
  .balance-card .card-header h3 { font-size: 18px; }
  .card-body { padding: 20px; }
  .balance-amount { font-size: 28px; }
  
  .transaction-card { padding: 16px 18px; }
  .card-header-row { gap: 12px; }
  .doc-number .value, .date .value { font-size: 13px; }
  .doc-number .label, .date .label { font-size: 11px; }
  .description { flex-direction: column; }
  .description .label { min-width: auto; }
  .description .value { font-size: 14px; }
  .changes-row { flex-direction: column; gap: 8px; align-items: flex-start; }
  .change-label { font-size: 13px; }
  .change-value { font-size: 14px; }
  .balance-value { font-size: 18px; }
  
  .balances-row { flex-direction: column; gap: 12px; }
  .balance-divider { display: none; }
  .balance-item { width: 100%; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px dashed #cbd5e1; }
  .balance-item:last-child { padding-bottom: 0; border-bottom: none; }
  .balance-label { font-size: 13px; }
  
  .loading-state { margin: 0 16px; padding: 40px; }
  .empty-state { padding: 40px; }
  .empty-icon { font-size: 36px; }
  .empty-state p { font-size: 14px; }
  
  .detail-grid { grid-template-columns: 1fr; }
  .detail-item-full { grid-column: span 1; }
  .detail-section { grid-column: span 1; }
  .detail-row { grid-template-columns: 1fr; }
  
  .last-update-item { justify-content: center; flex-wrap: wrap; }
  .last-update-value { font-size: 13px; }
}

@media (max-width: 480px) {
  .pagination-controls { flex-direction: column; }
  .balance-value { font-size: 16px; }
  .change-value { font-size: 13px; }
  .separator-line { margin: 12px 0 10px 0; }
  .last-update-value { font-size: 11px; }
  .section-header h2 { font-size: 18px; }
  .total-badge { font-size: 12px; padding: 6px 14px; }
  .btn-detail { padding: 8px 16px; font-size: 13px; }
  .pagination-button { padding: 8px 18px; font-size: 13px; }
}
</style>