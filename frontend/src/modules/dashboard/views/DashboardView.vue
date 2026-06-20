<template>
  <div class="dashboard-container">
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

    <!-- پیام روزانه -->
    <div v-if="dailyMessage" class="daily-message-card" :class="{ 'message-updated': messageHighlight }">
      <div class="message-icon">🔔</div>
      <div class="message-content">
        <p v-for="(line, index) in formattedMessageLines" :key="index" class="message-line">
          {{ line }}
        </p>
        <small>پیام روزانه | مدیریت</small>
      </div>
    </div>

    <div class="price-header">
      <div class="price-header-buy">بخرید</div>
      <div class="price-header-name">
        <span>نام نماد</span>
      </div>
      <div class="price-header-sell">بفروش</div>
    </div>

    <div class="sub-header melted-subheader">
      <div class="sub-header-buy"></div>
      <div class="sub-header-name">
        <span class="sub-label">آبشده</span>
        <span class="sub-time">{{ lastMeltedUpdateFormatted }}</span>
      </div>
      <div class="sub-header-sell"></div>
    </div>

    <div class="products-section" v-if="!loading">
      <div v-for="product in displayMelted" :key="product.code" class="product-row">
        <div 
          v-if="product.has_price && product.is_visible_buy !== false && product.buy_price && product.buy_price > 0"
          class="product-buy" 
          @click="openBuyModal(product)"
        >
          <span class="price-value buy-price">{{ formatNumberWithComma(product.buy_price) }}</span>
        </div>
        <div v-else class="product-buy empty">
          <span class="empty-price">---</span>
        </div>

        <div class="product-name">
          <h3>{{ product.display_name || product.name }}</h3>
        </div>

        <div 
          v-if="product.has_price && product.is_visible_sell !== false && product.sell_price && product.sell_price > 0"
          class="product-sell" 
          @click="openSellModal(product)"
        >
          <span class="price-value sell-price">{{ formatNumberWithComma(product.sell_price) }}</span>
        </div>
        <div v-else class="product-sell empty">
          <span class="empty-price">---</span>
        </div>
      </div>
    </div>

    <div class="sub-header coin-subheader">
      <div class="sub-header-buy"></div>
      <div class="sub-header-name">
        <span class="sub-label">مسکوکات</span>
        <span class="sub-time">{{ lastCoinUpdateFormatted }}</span>
      </div>
      <div class="sub-header-sell"></div>
    </div>

    <div class="products-section" v-if="!loading">
      <div v-for="product in displayCoins" :key="product.code" class="product-row">
        <div 
          v-if="product.has_price && product.is_visible_buy !== false && product.buy_price && product.buy_price > 0"
          class="product-buy" 
          @click="openBuyModal(product)"
        >
          <span class="price-value buy-price">{{ formatNumberWithComma(product.buy_price) }}</span>
        </div>
        <div v-else class="product-buy empty">
          <span class="empty-price">---</span>
        </div>

        <div class="product-name">
          <h3>{{ product.display_name || product.name }}</h3>
        </div>

        <div 
          v-if="product.has_price && product.is_visible_sell !== false && product.sell_price && product.sell_price > 0"
          class="product-sell" 
          @click="openSellModal(product)"
        >
          <span class="price-value sell-price">{{ formatNumberWithComma(product.sell_price) }}</span>
        </div>
        <div v-else class="product-sell empty">
          <span class="empty-price">---</span>
        </div>
      </div>
    </div>

    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>در حال بارگذاری...</p>
    </div>

    <!-- بخش تراکنش‌های امروز -->
    <div class="transactions-section" v-if="todayTransactions.length > 0">
      <div class="section-divider">
        <div class="divider-line"></div>
        <div class="transactions-title-box">
          <span class="title-icon"></span>
          <span class="title-text">تراکنش‌های امروز</span>
          <span class="title-count">{{ todayTransactions.length }}</span>
        </div>
        <div class="divider-line"></div>
      </div>

      <div class="transactions-list">
        <div v-for="tx in todayTransactions" :key="tx.id" class="transaction-card" :class="'status-' + tx.status">
          <div class="card-header">
            <div class="header-left">
              <span class="transaction-type-badge" :class="tx.type === 'خرید' ? 'buy-type' : 'sell-type'">
                {{ tx.type === 'خرید' ? 'خرید' : 'فروش' }}
              </span>
              <span class="transaction-product-name">{{ tx.display_name || tx.product_code }}</span>
            </div>
            <div class="header-right">
              <span class="transaction-time"> {{ formatTime(tx.created_at) }}</span>
              <div class="status-badge" :class="'status-' + tx.status">
                <span class="status-dot"></span>
                <span>{{ getStatusText(tx.status) }}</span>
              </div>
              <div v-if="tx.status === 'pending' && tx.remaining_seconds" class="timer-badge" :class="{ warning: tx.remaining_seconds <= 10 }">
                <span>⏳</span>
                <span>{{ formatRemainingTime(tx.remaining_seconds) }}</span>
              </div>
            </div>
          </div>
          
          <div class="card-divider"></div>
          
          <div class="card-description">
            <span class="description-text">
              شرح: {{ tx.type === 'خرید' ? 'خرید' : 'فروش' }} {{ tx.display_name || tx.product_code }} 
              به {{ tx.coin_quantity ? 'تعداد' : 'وزن' }} 
              <strong>{{ tx.coin_quantity ? formatCoinCount(tx.coin_quantity) : formatWeight(tx.melted_weight) }}</strong> 
              {{ tx.coin_quantity ? 'عدد' : 'گرم' }} 
              به قیمت <strong>{{ formatNumberWithComma(tx.transaction_price) }}</strong> ریال 
              و به مبلغ <strong>{{ formatNumberWithComma(tx.amount) }}</strong> ریال
            </span>
          </div>
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

    <!-- مودال ثبت سفارش -->
    <Teleport to="body">
      <div v-if="isModalOpen && selectedSymbol" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title">
              <span :class="transactionType === 'buy' ? 'type-badge-buy' : 'type-badge-sell'">
                {{ transactionType === 'buy' ? 'خرید' : 'فروش' }}
              </span>
              <span class="product-name-title">{{ selectedSymbol.display_name || selectedSymbol.name }}</span>
            </div>
          </div>

          <div class="modal-body">
            <div class="price-info">
              <div class="price-item">
                <span class="price-label">قیمت {{ transactionType === 'buy' ? 'خرید' : 'فروش' }}</span>
                <span class="price-value" :class="transactionType === 'buy' ? 'buy-price-text' : 'sell-price-text'">
                  {{ formatNumberWithComma(currentDisplayPrice) }}
                </span>
              </div>
              <div v-if="selectedSymbol.type === 'melted'" class="price-item">
                <span class="price-label">قیمت هر گرم</span>
                <span class="price-value">{{ formatNumberWithComma(currentDisplayPricePerGram) }}</span>
              </div>
            </div>

            <div class="input-group">
              <div class="input-wrapper">
                <input
                  ref="quantityInputRef"
                  type="text"
                  :value="quantityDisplay"
                  @input="handleQuantityInput"
                  @blur="handleQuantityBlur"
                  :placeholder="selectedSymbol.type === 'melted' ? 'مقدار (گرم)' : 'تعداد (عدد)'"
                  class="main-input text-center"
                />
                <span class="input-unit">{{ selectedSymbol.type === 'melted' ? 'گرم' : 'عدد' }}</span>
              </div>
            </div>

            <div v-if="selectedSymbol.type === 'melted'" class="input-group">
              <div class="input-wrapper amount-wrapper">
                <input
                  ref="amountInputRef"
                  type="text"
                  :value="amountDisplay"
                  @input="handleAmountInput"
                  @blur="handleAmountBlur"
                  placeholder="مبلغ (ریال)"
                  class="main-input amount-input text-center"
                />
                <span class="input-unit">ریال</span>
              </div>
            </div>

            <div v-if="selectedSymbol.type === 'coin'" class="input-group">
              <div class="input-wrapper amount-wrapper disabled">
                <input
                  type="text"
                  :value="amountDisplay"
                  disabled
                  placeholder="مبلغ معامله"
                  class="main-input amount-input text-center disabled-input"
                />
                <span class="input-unit">ریال</span>
              </div>
            </div>

            <div class="limits-row">
              <div class="limit-item">
                <span class="limit-label">حداقل:</span>
                <span class="limit-value">{{ formatNumberWithComma(minLimitValue) }} {{ selectedSymbol.type === 'melted' ? 'گرم' : 'عدد' }}</span>
              </div>
              <div class="limit-divider"></div>
              <div class="limit-item">
                <span class="limit-label">حداکثر:</span>
                <span class="limit-value">{{ formatNumberWithComma(maxLimitValue) }} {{ selectedSymbol.type === 'melted' ? 'گرم' : 'عدد' }}</span>
              </div>
            </div>

            <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

            <div class="modal-buttons">
              <button @click="confirmTransaction" :disabled="!isFormValid" class="btn-primary">
                تأیید و ثبت
              </button>
              <button @click="closeModal" class="btn-secondary">انصراف</button>
            </div>
          </div>
        </div>
      </div>

      <!-- مودال تایید نهایی -->
      <div v-if="isConfirmModalOpen && pendingTx" class="modal-overlay" @click.self="closeConfirmModal">
        <div class="modal-container confirm-modal">
          <div class="modal-header">
            <div class="modal-title">
              <span :class="pendingTx.type === 'buy' ? 'type-badge-buy' : 'type-badge-sell'">
                {{ pendingTx.type === 'buy' ? 'خرید' : 'فروش' }}
              </span>
              <span class="product-name-title">{{ pendingTx.display_name }}</span>
            </div>
          </div>
          
          <transition name="fade-warning">
            <div v-if="showPriceWarning" class="price-warning-box">
              <div class="warning-title">⚠️ تغییر قیمت {{ pendingTx.display_name }}</div>
              <div class="warning-divider"></div>
              <div class="warning-details">
                <span class="old-price">قیمت قبلی: {{ formatNumberWithComma(oldPriceValue) }} ریال</span>
                <span class="new-price">قیمت جدید: {{ formatNumberWithComma(currentConfirmPrice) }} ریال</span>
              </div>
            </div>
          </transition>
          
          <div class="modal-body">
            <div class="confirm-details">
              <div class="confirm-row">
                <span>مقدار:</span>
                <strong>
                  {{ pendingTx.unit === 'گرم' ? formatWeight(pendingTx.quantity) : formatCoinCount(pendingTx.quantity) }}
                  {{ pendingTx.unit }}
                </strong>
              </div>
              <div class="confirm-row">
                <span>قیمت واحد:</span>
                <strong :class="pendingTx.type === 'buy' ? 'buy-price-text' : 'sell-price-text'">
                  {{ formatNumberWithComma(currentConfirmPrice) }} ریال
                </strong>
              </div>
              <div class="confirm-row">
                <span>مبلغ کل:</span>
                <strong class="amount-highlight">{{ formatNumberWithComma(currentConfirmAmount) }} ریال</strong>
              </div>
            </div>
            <div class="modal-buttons">
              <button @click="submitTransaction" :disabled="isSubmitting" class="btn-primary">
                {{ isSubmitting ? 'در حال ثبت...' : 'تأیید نهایی' }}
              </button>
              <button @click="closeConfirmModal" class="btn-secondary">انصراف</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isTimerOpen" class="modal-overlay" @click.self="stopTimer">
        <div class="timer-modal">
          <div class="timer-circle">
            <span class="timer-number">{{ formatTimerNumber(currentTimer) }}</span>
          </div>
          <p class="timer-text">درخواست در حال بررسی...</p>
          <p class="timer-subtext">لطفاً منتظر بمانید</p>
        </div>
      </div>

      <!-- مودال نتیجه تراکنش -->
      <div v-if="isResultModalOpen && resultTransaction" class="modal-overlay" @click.self="closeResultModal">
        <div class="modal-container result-modal">
          <div class="modal-header result-header" :class="`result-header-${resultTransaction.status}`">
            <div class="modal-title">
              <span :class="resultTransaction.type === 'buy' ? 'type-badge-buy' : 'type-badge-sell'">
                {{ resultTransaction.type === 'buy' ? 'خرید' : 'فروش' }}
              </span>
              <span class="product-name-title">{{ resultTransaction.display_name }}</span>
            </div>
          </div>
          
          <div class="modal-body result-body">
            <div class="result-icon" :class="`result-icon-${resultTransaction.status}`">
              <span v-if="resultTransaction.status === 'approved'">✓</span>
              <span v-else-if="resultTransaction.status === 'rejected'">✕</span>
              <span v-else-if="resultTransaction.status === 'expired'">⏰</span>
            </div>
            
            <div class="result-message">
              <span v-if="resultTransaction.status === 'approved'">درخواست شما تأیید شد</span>
              <span v-else-if="resultTransaction.status === 'rejected'">درخواست شما رد شد</span>
              <span v-else-if="resultTransaction.status === 'expired'">درخواست شما منقضی شد</span>
            </div>
            
            <div class="result-divider"></div>
            
            <div class="result-details">
              <div class="detail-row">
                <span class="detail-label">قیمت واحد:</span>
                <span class="detail-value">{{ formatNumberWithComma(resultTransaction.transaction_price) }} ریال</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">{{ resultTransaction.coin_quantity ? 'تعداد:' : 'وزن:' }}</span>
                <span class="detail-value">
                  {{ resultTransaction.coin_quantity ? formatCoinCount(resultTransaction.coin_quantity) : formatWeight(resultTransaction.melted_weight) }}
                  {{ resultTransaction.coin_quantity ? 'عدد' : 'گرم' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">مبلغ کل:</span>
                <span class="detail-value amount-value">{{ formatNumberWithComma(resultTransaction.amount) }} ریال</span>
              </div>
            </div>
            
            <div class="result-divider"></div>
            
            <div class="result-date">
              <span> {{ formatFullDate(resultTransaction.created_at) }}</span>
              <span> {{ formatFullTime(resultTransaction.created_at) }}</span>
            </div>
            
            <div class="result-buttons">
              <button @click="closeResultModal" class="btn-secondary">بستن</button>
              <button v-if="resultTransaction.status === 'expired'" @click="retryTransaction" class="btn-primary retry-btn">
                تکرار تراکنش
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- مودال اعلان سیستمی -->
      <div v-if="isNotificationModalOpen && currentNotification" class="modal-overlay" @click.self="closeNotificationModal">
        <div class="modal-container notification-modal">
          <div class="modal-header notification-header" :class="`header-${currentNotification.notification_type || 'info'}`">
            <div class="modal-title">
              <span class="message-header-icon">
                <span v-if="currentNotification.notification_type === 'success'">✅</span>
                <span v-else-if="currentNotification.notification_type === 'warning'">⚠️</span>
                <span v-else-if="currentNotification.notification_type === 'error'">❌</span>
                <span v-else-if="currentNotification.notification_type === 'info'">ℹ️</span>
                <span v-else>🔔</span>
              </span>
              <span class="message-header-title">{{ currentNotification.title || 'اعلان جدید' }}</span>
            </div>
          </div>
          
          <div class="modal-body notification-body">
            <div class="notification-content">
              <div class="notification-text">
                <p v-for="(line, index) in notificationLines" :key="index" class="notification-line">
                  {{ line }}
                </p>
              </div>
            </div>
            
            <div class="modal-buttons">
              <button @click="markNotificationAsReadAndClose" class="btn-primary understood-btn">
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/auth/stores/authStore';
import { api } from '@/core/http/axios';
import { connectSocket, offAllEvents } from '@/core/socket/socket.io';

const router = useRouter();
const authStore = useAuthStore();
const user = computed(() => authStore.user);

// State
const isSidebarOpen = ref(false);
const isMobile = ref(window.innerWidth < 768);
const loading = ref(true);
const products = ref<any[]>([]);
const transactions = ref<any[]>([]);
const dailyMessage = ref<any>(null);
const isConnected = ref(false);
const messageHighlight = ref(false);
let messageHighlightTimeout: any = null;

// Result Modal State
const isResultModalOpen = ref(false);
const resultTransaction = ref<any>(null);

// Notification Modal State
const isNotificationModalOpen = ref(false);
const currentNotification = ref<any>(null);
const processingNotification = ref(false);
const dismissedNotifications = ref<Set<number>>(new Set());

// Modal states
const isModalOpen = ref(false);
const isConfirmModalOpen = ref(false);
const isTimerOpen = ref(false);
const isSubmitting = ref(false);

const selectedSymbol = ref<any>(null);
const transactionType = ref<'buy' | 'sell'>('buy');

const quantityValue = ref<number>(0);
const amountValue = ref<number>(0);
const quantityDisplay = ref('');
const amountDisplay = ref('');
const errorMsg = ref('');
const pendingTx = ref<any>(null);
const currentTimer = ref(0);
const pendingTransactionId = ref<string | null>(null);

const currentDisplayPrice = ref(0);
const currentDisplayPricePerGram = ref(0);
const showPriceWarning = ref(false);
const oldPriceValue = ref(0);
const currentConfirmPrice = ref(0);
const currentConfirmQuantity = ref(0);
const currentConfirmAmount = ref(0);

let socket: any = null;
let timerInterval: any = null;
let warningTimeout: any = null;

// تبدیل اعداد
const toEnglishNumber = (str: string): string => {
  const persianNumbers: { [key: string]: string } = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };
  return str.replace(/[۰-۹]/g, (char) => persianNumbers[char] || char);
};

const toPersianNumber = (str: string): string => {
  const englishNumbers: { [key: string]: string } = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  return str.replace(/[0-9]/g, (char) => englishNumbers[char] || char);
};

const addThousandSeparator = (num: number | string): string => {
  let numStr = num.toString().replace(/[^0-9]/g, '');
  if (!numStr || numStr === '0') return '۰';
  
  let result = '';
  let counter = 0;
  for (let i = numStr.length - 1; i >= 0; i--) {
    counter++;
    result = numStr[i] + result;
    if (counter % 3 === 0 && i !== 0) {
      result = ',' + result;
    }
  }
  return toPersianNumber(result);
};

const formatNumberWithComma = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return '۰';
  
  let numValue: number;
  if (typeof num === 'string') {
    const cleaned = num.replace(/,/g, '');
    numValue = parseFloat(cleaned);
  } else {
    numValue = num;
  }
  
  if (isNaN(numValue) || numValue === 0) return '۰';
  return addThousandSeparator(Math.floor(numValue));
};

const formatWeight = (num: number | null | undefined): string => {
  if (!num || num === 0) return '۰';
  const rounded = Math.round(num * 1000) / 1000;
  let str = rounded.toString();
  
  if (str.includes('.')) {
    let parts = str.split('.');
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

const formatTimerNumber = (num: number): string => {
  return toPersianNumber(num.toString());
};

const persianDate = computed(() => {
  const date = new Date();
  return new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
});

// تبدیل UTC به زمان ایران با افست 14 ساعت
const convertUTCToIranTime = (utcDateStr: string): Date => {
  const utcDate = new Date(utcDateStr);
  const IRAN_OFFSET_MS = 14 * 60 * 60 * 1000;
  const iranTimestamp = utcDate.getTime() + IRAN_OFFSET_MS;
  return new Date(iranTimestamp);
};

// فرمت زمان برای نمایش با ساعت و دقیقه و ثانیه
const formatTimeForDisplay = (date: Date | string | null) => {
  if (!date) return '--:--:--';
  
  let utcDate: Date;
  if (typeof date === 'string') {
    utcDate = new Date(date);
  } else {
    utcDate = date;
  }
  
  if (isNaN(utcDate.getTime())) return '--:--:--';
  if (utcDate.getFullYear() < 2000) return '--:--:--';
  
  const iranDate = convertUTCToIranTime(utcDate.toISOString());
  
  let hours = iranDate.getUTCHours();
  let minutes = iranDate.getUTCMinutes();
  let seconds = iranDate.getUTCSeconds();
  
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');
  
  return `${toPersianNumber(hoursStr)}:${toPersianNumber(minutesStr)}:${toPersianNumber(secondsStr)}`;
};

const getLatestUpdateTime = (productsList: any[], type: string): Date | null => {
  const filteredProducts = productsList.filter(p => {
    if (p.type !== type) return false;
    if (!p.updated_at) return false;
    if (p.updated_at === 'null') return false;
    
    if (type === 'melted') {
      return (p.buy_price > 0 || p.sell_price > 0);
    } else {
      return (p.buy_price > 0 || p.sell_price > 0);
    }
  });
  
  if (filteredProducts.length === 0) return null;
  
  let latestDate: Date | null = null;
  for (const product of filteredProducts) {
    const updateDate = new Date(product.updated_at);
    if (!isNaN(updateDate.getTime()) && updateDate.getFullYear() > 2000) {
      if (!latestDate || updateDate > latestDate) {
        latestDate = updateDate;
      }
    }
  }
  return latestDate;
};

const lastMeltedUpdateFormatted = computed(() => {
  const latestTime = getLatestUpdateTime(products.value, 'melted');
  if (latestTime) {
    return formatTimeForDisplay(latestTime);
  }
  return '--:--:--';
});

const lastCoinUpdateFormatted = computed(() => {
  const latestTime = getLatestUpdateTime(products.value, 'coin');
  if (latestTime) {
    return formatTimeForDisplay(latestTime);
  }
  return '--:--:--';
});

const formattedMessageLines = computed(() => {
  if (!dailyMessage.value?.message_text) return [];
  return dailyMessage.value.message_text.split('.').filter((line: string) => line.trim().length > 0);
});

const notificationLines = computed(() => {
  if (!currentNotification.value?.message_text) return [];
  const text = currentNotification.value.message_text;
  let lines: string[] = [];
  
  const newLineParts = text.split('\n');
  for (const part of newLineParts) {
    const dotParts = part.split('.');
    for (const dotPart of dotParts) {
      const trimmed = dotPart.trim();
      if (trimmed.length > 0) {
        lines.push(trimmed);
      }
    }
  }
  
  return lines;
});

const todayTransactions = computed(() => {
  const today = new Date().toDateString();
  return transactions.value.filter(tx => new Date(tx.created_at).toDateString() === today).slice(0, 10);
});

const displayMelted = computed(() => {
  return products.value.filter(p => p.type === 'melted' && p.is_active !== false);
});

const displayCoins = computed(() => {
  return products.value.filter(p => p.type === 'coin' && p.is_active !== false);
});

const normalizeProduct = (product: any) => {
  const buyPrice = Number(product.buy_price) || 0;
  const sellPrice = Number(product.sell_price) || 0;
  const finalBuyPrice = Number(product.final_buy_price) || buyPrice;
  const finalSellPrice = Number(product.final_sell_price) || sellPrice;
  
  const hasValidBuyPrice = buyPrice > 0 && finalBuyPrice > 0;
  const hasValidSellPrice = sellPrice > 0 && finalSellPrice > 0;
  
  return {
    ...product,
    code: product.code || product.product_code,
    buy_price: hasValidBuyPrice ? buyPrice : 0,
    sell_price: hasValidSellPrice ? sellPrice : 0,
    final_buy_price: hasValidBuyPrice ? finalBuyPrice : 0,
    final_sell_price: hasValidSellPrice ? finalSellPrice : 0,
    is_visible_buy: product.is_visible_buy === true && hasValidBuyPrice,
    is_visible_sell: product.is_visible_sell === true && hasValidSellPrice,
    is_active: product.is_active !== false,
    type: product.type === 'coin' ? 'coin' : 'melted',
    display_name: product.display_name || product.name,
    min_weight: product.min_weight,
    max_weight: product.max_weight,
    min_count: product.min_count,
    max_count: product.max_count,
    has_price: product.has_price === true && (hasValidBuyPrice || hasValidSellPrice),
    updated_at: product.updated_at && product.updated_at !== 'null' ? product.updated_at : null
  };
};

const getCurrentProductPrice = () => {
  if (!selectedSymbol.value) return 0;
  if (transactionType.value === 'buy') {
    const price = selectedSymbol.value.final_buy_price ?? selectedSymbol.value.buy_price ?? 0;
    return Number(price);
  } else {
    const price = selectedSymbol.value.final_sell_price ?? selectedSymbol.value.sell_price ?? 0;
    return Number(price);
  }
};

const getPricePerGram = () => {
  if (!selectedSymbol.value || selectedSymbol.value.type !== 'melted') return 0;
  const GOLD_TO_COIN_RATIO = 4.3318;
  const price = getCurrentProductPrice();
  if (price === 0) return 0;
  return Math.floor(price / GOLD_TO_COIN_RATIO);
};

const minLimitValue = computed(() => {
  if (!selectedSymbol.value) return 0;
  return selectedSymbol.value.type === 'melted' ? selectedSymbol.value.min_weight : selectedSymbol.value.min_count;
});

const maxLimitValue = computed(() => {
  if (!selectedSymbol.value) return 0;
  return selectedSymbol.value.type === 'melted' ? selectedSymbol.value.max_weight : selectedSymbol.value.max_count;
});

const isFormValid = computed(() => {
  if (!selectedSymbol.value) return false;
  if (selectedSymbol.value.type === 'melted') {
    if (quantityValue.value > 0) {
      return quantityValue.value >= minLimitValue.value && quantityValue.value <= maxLimitValue.value;
    }
    if (amountValue.value > 0) {
      return amountValue.value > 0;
    }
    return false;
  } else {
    return quantityValue.value >= minLimitValue.value && quantityValue.value <= maxLimitValue.value;
  }
});

const formatTime = (date: string) => {
  if (!date) return '';
  const utcDate = new Date(date);
  const iranDate = convertUTCToIranTime(utcDate.toISOString());
  const hours = iranDate.getUTCHours().toString().padStart(2, '0');
  const minutes = iranDate.getUTCMinutes().toString().padStart(2, '0');
  return `${toPersianNumber(hours)}:${toPersianNumber(minutes)}`;
};

const formatFullDate = (date: string) => {
  if (!date) return '';
  const utcDate = new Date(date);
  const iranDate = convertUTCToIranTime(utcDate.toISOString());
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(iranDate);
};

const formatFullTime = (date: string) => {
  if (!date) return '';
  const utcDate = new Date(date);
  const iranDate = convertUTCToIranTime(utcDate.toISOString());
  const hours = iranDate.getUTCHours().toString().padStart(2, '0');
  const minutes = iranDate.getUTCMinutes().toString().padStart(2, '0');
  const seconds = iranDate.getUTCSeconds().toString().padStart(2, '0');
  return `${toPersianNumber(hours)}:${toPersianNumber(minutes)}:${toPersianNumber(seconds)}`;
};

const formatRemainingTime = (seconds: number) => {
  if (!seconds) return '۰';
  if (seconds <= 0) return '۰';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${toPersianNumber(mins.toString())}:${toPersianNumber(secs.toString().padStart(2, '0'))}`;
  return `${toPersianNumber(secs.toString())} ثانیه`;
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

const calculateAmountFromWeight = (weight: number): number => {
  if (!selectedSymbol.value || selectedSymbol.value.type !== 'melted' || weight <= 0) return 0;
  const price = getCurrentProductPrice();
  if (price <= 0) return 0;
  const GOLD_TO_COIN_RATIO = 4.3318;
  return Math.floor(weight * (price / GOLD_TO_COIN_RATIO));
};

const calculateWeightFromAmount = (amount: number): number => {
  if (!selectedSymbol.value || selectedSymbol.value.type !== 'melted' || amount <= 0) return 0;
  const price = getCurrentProductPrice();
  if (price <= 0) return 0;
  const GOLD_TO_COIN_RATIO = 4.3318;
  const weight = amount / (price / GOLD_TO_COIN_RATIO);
  return Math.round(weight * 1000) / 1000;
};

const calculateAmountFromCount = (count: number): number => {
  if (!selectedSymbol.value || selectedSymbol.value.type !== 'coin' || count <= 0) return 0;
  return Math.floor(count * getCurrentProductPrice());
};

const updateQuantityDisplayField = (value: number) => {
  if (value <= 0) {
    quantityDisplay.value = '';
    return;
  }
  
  if (selectedSymbol.value?.type === 'melted') {
    const rounded = Math.round(value * 1000) / 1000;
    quantityDisplay.value = toPersianNumber(rounded.toString());
  } else {
    quantityDisplay.value = toPersianNumber(Math.floor(value).toString());
  }
};

const updateAmountDisplayField = (value: number) => {
  if (value <= 0) {
    amountDisplay.value = '';
    return;
  }
  amountDisplay.value = toPersianNumber(addThousandSeparator(value));
};

const updateModalPrices = () => {
  currentDisplayPrice.value = getCurrentProductPrice();
  currentDisplayPricePerGram.value = getPricePerGram();
  
  if (selectedSymbol.value?.type === 'melted') {
    if (quantityValue.value > 0) {
      const newAmount = calculateAmountFromWeight(quantityValue.value);
      amountValue.value = newAmount;
      updateAmountDisplayField(amountValue.value);
    } else if (amountValue.value > 0) {
      const newWeight = calculateWeightFromAmount(amountValue.value);
      quantityValue.value = newWeight;
      updateQuantityDisplayField(quantityValue.value);
    }
  } else if (selectedSymbol.value?.type === 'coin') {
    if (quantityValue.value > 0) {
      const newAmount = calculateAmountFromCount(quantityValue.value);
      amountValue.value = newAmount;
      updateAmountDisplayField(amountValue.value);
    }
  }
};

const handleQuantityInput = (e: Event) => {
  if (!selectedSymbol.value) return;
  
  const input = e.target as HTMLInputElement;
  let rawValue = toEnglishNumber(input.value);
  
  if (selectedSymbol.value.type === 'melted') {
    let cleaned = rawValue.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (parts.length === 2 && parts[1].length > 3) {
      input.value = quantityDisplay.value;
      return;
    }
    
    let newValue = parseFloat(cleaned);
    if (isNaN(newValue)) newValue = 0;
    
    quantityValue.value = newValue;
    
    if (quantityValue.value > 0) {
      quantityDisplay.value = toPersianNumber(quantityValue.value.toString());
    } else {
      quantityDisplay.value = '';
    }
    
    if (quantityValue.value > 0) {
      amountValue.value = calculateAmountFromWeight(quantityValue.value);
      updateAmountDisplayField(amountValue.value);
    } else {
      amountValue.value = 0;
      amountDisplay.value = '';
    }
    
    if (quantityValue.value > 0) {
      if (quantityValue.value < minLimitValue.value) {
        errorMsg.value = `حداقل وزن مجاز ${formatNumberWithComma(minLimitValue.value)} گرم است`;
      } else if (quantityValue.value > maxLimitValue.value) {
        errorMsg.value = `حداکثر وزن مجاز ${formatNumberWithComma(maxLimitValue.value)} گرم است`;
      } else {
        errorMsg.value = '';
      }
    } else {
      errorMsg.value = '';
    }
  } else {
    let cleaned = rawValue.replace(/[^0-9]/g, '');
    let newValue = parseInt(cleaned);
    if (isNaN(newValue)) newValue = 0;
    quantityValue.value = newValue;
    
    if (quantityValue.value > 0) {
      quantityDisplay.value = toPersianNumber(quantityValue.value.toString());
      amountValue.value = calculateAmountFromCount(quantityValue.value);
      updateAmountDisplayField(amountValue.value);
    } else {
      quantityDisplay.value = '';
      amountValue.value = 0;
      amountDisplay.value = '';
    }
    
    if (quantityValue.value > 0) {
      if (quantityValue.value < minLimitValue.value) {
        errorMsg.value = `حداقل تعداد مجاز ${formatNumberWithComma(minLimitValue.value)} عدد است`;
      } else if (quantityValue.value > maxLimitValue.value) {
        errorMsg.value = `حداکثر تعداد مجاز ${formatNumberWithComma(maxLimitValue.value)} عدد است`;
      } else {
        errorMsg.value = '';
      }
    } else {
      errorMsg.value = '';
    }
  }
};

const handleQuantityBlur = () => {
  if (!selectedSymbol.value) return;
  if (selectedSymbol.value.type === 'melted' && quantityValue.value > 0) {
    updateQuantityDisplayField(quantityValue.value);
  }
};

const handleAmountInput = (e: Event) => {
  if (!selectedSymbol.value || selectedSymbol.value.type !== 'melted') return;
  
  const input = e.target as HTMLInputElement;
  let rawValue = toEnglishNumber(input.value);
  
  rawValue = rawValue.replace(/,/g, '');
  
  let newValue = parseInt(rawValue);
  if (isNaN(newValue)) newValue = 0;
  amountValue.value = newValue;
  
  if (amountValue.value > 0) {
    amountDisplay.value = toPersianNumber(addThousandSeparator(amountValue.value.toString()));
    quantityValue.value = calculateWeightFromAmount(amountValue.value);
    if (quantityValue.value > 0) {
      const roundedWeight = Math.round(quantityValue.value * 1000) / 1000;
      quantityDisplay.value = toPersianNumber(roundedWeight.toString());
    } else {
      quantityDisplay.value = '';
    }
  } else {
    amountDisplay.value = '';
    quantityValue.value = 0;
    quantityDisplay.value = '';
  }
  
  errorMsg.value = '';
};

const handleAmountBlur = () => {
  if (!selectedSymbol.value || selectedSymbol.value.type !== 'melted') return;
  if (amountValue.value > 0) {
    amountDisplay.value = toPersianNumber(addThousandSeparator(amountValue.value.toString()));
  }
  if (quantityValue.value > 0) {
    updateQuantityDisplayField(quantityValue.value);
  }
};

const openBuyModal = (product: any) => {
  if (product.is_visible_buy === false || product.buy_price === 0) {
    alert('قیمت خرید این محصول در دسترس نیست');
    return;
  }
  selectedSymbol.value = { ...product };
  transactionType.value = 'buy';
  quantityValue.value = 0;
  amountValue.value = 0;
  quantityDisplay.value = '';
  amountDisplay.value = '';
  errorMsg.value = '';
  currentDisplayPrice.value = getCurrentProductPrice();
  currentDisplayPricePerGram.value = getPricePerGram();
  isModalOpen.value = true;
};

const openSellModal = (product: any) => {
  if (product.is_visible_sell === false || product.sell_price === 0) {
    alert('قیمت فروش این محصول در دسترس نیست');
    return;
  }
  selectedSymbol.value = { ...product };
  transactionType.value = 'sell';
  quantityValue.value = 0;
  amountValue.value = 0;
  quantityDisplay.value = '';
  amountDisplay.value = '';
  errorMsg.value = '';
  currentDisplayPrice.value = getCurrentProductPrice();
  currentDisplayPricePerGram.value = getPricePerGram();
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedSymbol.value = null;
  errorMsg.value = '';
};

const calculateConfirmValues = () => {
  if (!pendingTx.value || !selectedSymbol.value) return;
  
  const currentPrice = getCurrentProductPrice();
  currentConfirmPrice.value = currentPrice;
  currentConfirmQuantity.value = pendingTx.value.quantity;
  
  if (selectedSymbol.value.type === 'melted') {
    currentConfirmAmount.value = calculateAmountFromWeight(pendingTx.value.quantity);
  } else {
    currentConfirmAmount.value = calculateAmountFromCount(pendingTx.value.quantity);
  }
};

const confirmTransaction = () => {
  if (!selectedSymbol.value) return;
  
  let finalQuantity = quantityValue.value;
  let finalAmount = amountValue.value;
  
  if (selectedSymbol.value.type === 'melted') {
    if (quantityValue.value > 0) {
      if (quantityValue.value < minLimitValue.value || quantityValue.value > maxLimitValue.value) {
        errorMsg.value = `وزن باید بین ${formatNumberWithComma(minLimitValue.value)} و ${formatNumberWithComma(maxLimitValue.value)} گرم باشد`;
        return;
      }
      finalAmount = calculateAmountFromWeight(quantityValue.value);
    } else if (amountValue.value > 0) {
      finalQuantity = calculateWeightFromAmount(amountValue.value);
      if (finalQuantity < minLimitValue.value || finalQuantity > maxLimitValue.value) {
        errorMsg.value = `وزن محاسبه شده (${formatWeight(finalQuantity)} گرم) خارج از محدوده مجاز است`;
        return;
      }
      finalAmount = amountValue.value;
    } else {
      errorMsg.value = 'لطفاً وزن یا مبلغ را وارد کنید';
      return;
    }
  } else {
    if (quantityValue.value < minLimitValue.value || quantityValue.value > maxLimitValue.value) {
      errorMsg.value = `تعداد باید بین ${formatNumberWithComma(minLimitValue.value)} و ${formatNumberWithComma(maxLimitValue.value)} عدد باشد`;
      return;
    }
    finalAmount = calculateAmountFromCount(quantityValue.value);
    finalQuantity = quantityValue.value;
  }
  
  errorMsg.value = '';
  const unit = selectedSymbol.value.type === 'melted' ? 'گرم' : 'عدد';
  
  const currentPrice = getCurrentProductPrice();
  oldPriceValue.value = currentPrice;
  
  pendingTx.value = {
    product_code: selectedSymbol.value.code,
    type: transactionType.value,
    quantity: finalQuantity,
    amount: finalAmount,
    price: currentPrice,
    display_name: selectedSymbol.value.display_name || selectedSymbol.value.name,
    unit,
    melted_weight: selectedSymbol.value.type === 'melted' ? finalQuantity : null,
    coin_quantity: selectedSymbol.value.type === 'coin' ? finalQuantity : null
  };
  
  calculateConfirmValues();
  
  isModalOpen.value = false;
  isConfirmModalOpen.value = true;
};

const closeConfirmModal = () => {
  isConfirmModalOpen.value = false;
  pendingTx.value = null;
  showPriceWarning.value = false;
  if (warningTimeout) clearTimeout(warningTimeout);
  isModalOpen.value = true;
};

const startTimer = (duration: number) => {
  if (timerInterval) clearInterval(timerInterval);
  currentTimer.value = duration;
  isTimerOpen.value = true;
  
  timerInterval = setInterval(() => {
    if (currentTimer.value <= 1) {
      clearInterval(timerInterval);
      timerInterval = null;
      isTimerOpen.value = false;
      
      if (pendingTransactionId.value) {
        const pendingTxIndex = transactions.value.findIndex(t => t.id === pendingTransactionId.value);
        if (pendingTxIndex !== -1 && transactions.value[pendingTxIndex].status === 'pending') {
          const expiredTx = {
            ...transactions.value[pendingTxIndex],
            status: 'expired'
          };
          transactions.value[pendingTxIndex] = expiredTx;
          showResultModal(expiredTx);
          pendingTransactionId.value = null;
        }
      }
    } else {
      currentTimer.value--;
    }
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isTimerOpen.value = false;
  pendingTransactionId.value = null;
};

const submitTransaction = async () => {
  if (!pendingTx.value) return;
  
  isSubmitting.value = true;
  
  try {
    const response = await api.post('/transactions', {
      product_code: pendingTx.value.product_code,
      type: pendingTx.value.type,
      amount: currentConfirmAmount.value,
      melted_weight: pendingTx.value.melted_weight,
      coin_quantity: pendingTx.value.coin_quantity
    });
    
    if (response.data.success) {
      const tx = response.data.transaction;
      pendingTransactionId.value = tx.id;
      startTimer(tx.remaining_seconds || 30);
      
      const existingIndex = transactions.value.findIndex(t => t.id === tx.id);
      if (existingIndex === -1) {
        transactions.value = [tx, ...transactions.value];
      }
      
      isConfirmModalOpen.value = false;
      pendingTx.value = null;
      showPriceWarning.value = false;
      if (warningTimeout) clearTimeout(warningTimeout);
    }
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || 'خطا در ثبت تراکنش';
  } finally {
    isSubmitting.value = false;
  }
};

const showResultModal = (transaction: any) => {
  resultTransaction.value = transaction;
  isResultModalOpen.value = true;
};

const closeResultModal = () => {
  isResultModalOpen.value = false;
  setTimeout(() => {
    resultTransaction.value = null;
  }, 300);
};

const retryTransaction = () => {
  if (!resultTransaction.value) return;
  
  const product = products.value.find(p => p.code === resultTransaction.value.product_code);
  if (!product) return;
  
  closeResultModal();
  
  if (resultTransaction.value.type === 'buy') {
    openBuyModal(product);
  } else {
    openSellModal(product);
  }
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

const showNotificationModal = (notification: any) => {
  if (processingNotification.value) return;
  if (dismissedNotifications.value.has(notification.id)) return;
  
  processingNotification.value = true;
  currentNotification.value = notification;
  isNotificationModalOpen.value = true;
};

const markNotificationAsRead = async (notificationId: number) => {
  try {
    await api.put(`/notifications/${notificationId}/read`);
  } catch (err) {}
};

const markNotificationAsReadAndClose = async () => {
  if (currentNotification.value && currentNotification.value.id) {
    dismissedNotifications.value.add(currentNotification.value.id);
    await markNotificationAsRead(currentNotification.value.id);
  }
  
  closeNotificationModal();
};

const closeNotificationModal = () => {
  isNotificationModalOpen.value = false;
  setTimeout(() => {
    currentNotification.value = null;
    processingNotification.value = false;
  }, 300);
};

const checkUnseenNotifications = async () => {
  try {
    const response = await api.get('/notifications/unseen');
    if (response.data.success && response.data.data && response.data.data.length > 0) {
      for (const notification of response.data.data) {
        if (!dismissedNotifications.value.has(notification.id)) {
          showNotificationModal(notification);
          break;
        }
      }
    }
  } catch (err) {}
};

const loadDailyMessage = async () => {
  try {
    const response = await api.get('/daily-messages/active');
    if (response.data.success) {
      dailyMessage.value = response.data.data;
    }
  } catch (err) {}
};

const loadData = async () => {
  loading.value = true;
  try {
    const [productsRes, txRes] = await Promise.all([
      api.get('/prices/products'),
      api.get('/transactions/user')
    ]);
    
    if (productsRes.data.success) {
      const allProducts = [...(productsRes.data.data?.melted || []), ...(productsRes.data.data?.coins || [])];
      products.value = allProducts.map(normalizeProduct);
    }
    
    if (txRes.data.success) {
      transactions.value = txRes.data.data || [];
    }
  } catch (err) {
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
    isConnected.value = true;
    socketClient.emit('get_initial_prices');
  });
  
  socketClient.on('initial_prices', (data: any) => {
    if (data.success && data.data) {
      const allProducts = [...(data.data.melted || []), ...(data.data.coins || [])];
      products.value = allProducts.map(normalizeProduct);
      loading.value = false;
    }
  });
  
  socketClient.on('price_update', (data: any) => {
    const index = products.value.findIndex(p => p.code === data.product_code);
    if (index !== -1) {
      let finalBuyPrice = data.final_buy_price ?? data.buy_price;
      let finalSellPrice = data.final_sell_price ?? data.sell_price;
      
      if (finalBuyPrice === undefined && data.base_sell_price !== undefined && data.applied_offset !== undefined) {
        finalBuyPrice = Number(data.base_sell_price) + Number(data.applied_offset);
      }
      if (finalSellPrice === undefined && data.base_buy_price !== undefined && data.applied_offset !== undefined) {
        finalSellPrice = Number(data.base_buy_price) - Number(data.applied_offset);
      }
      
      finalBuyPrice = finalBuyPrice !== undefined && finalBuyPrice !== null ? Math.floor(Number(finalBuyPrice)) : products.value[index].final_buy_price;
      finalSellPrice = finalSellPrice !== undefined && finalSellPrice !== null ? Math.floor(Number(finalSellPrice)) : products.value[index].final_sell_price;
      
      const hasValidBuyPrice = finalBuyPrice > 0;
      const hasValidSellPrice = finalSellPrice > 0;
      
      const updatedAt = data.updated_at || (hasValidBuyPrice || hasValidSellPrice ? new Date().toISOString() : null);
      
      // اعمال منطق معکوس برای is_visible
      // اگر ادمین قیمت خرید را دیزابل کرده (is_visible_buy = false) 
      // پس برای کاربر قیمت فروش باید دیزابل شود (is_visible_sell = false)
      // و برعکس
      let userIsVisibleBuy = data.is_visible_sell;
      let userIsVisibleSell = data.is_visible_buy;
      
      // اگر مقدار از سرور نیامد، از مقدار قبلی استفاده کن
      if (data.is_visible_sell === undefined) {
        userIsVisibleBuy = products.value[index].is_visible_sell;
      }
      if (data.is_visible_buy === undefined) {
        userIsVisibleSell = products.value[index].is_visible_buy;
      }
      
      const updatedProduct = {
        ...products.value[index],
        buy_price: hasValidBuyPrice ? finalBuyPrice : 0,
        sell_price: hasValidSellPrice ? finalSellPrice : 0,
        final_buy_price: hasValidBuyPrice ? finalBuyPrice : 0,
        final_sell_price: hasValidSellPrice ? finalSellPrice : 0,
        base_buy_price: data.base_buy_price !== undefined ? Number(data.base_buy_price) : products.value[index].base_buy_price,
        base_sell_price: data.base_sell_price !== undefined ? Number(data.base_sell_price) : products.value[index].base_sell_price,
        applied_offset: data.applied_offset !== undefined ? Number(data.applied_offset) : products.value[index].applied_offset,
        // اعمال منطق معکوس: قیمت خرید کاربر = قیمت فروش ادمین (is_visible_sell ادمین)
        is_visible_buy: userIsVisibleBuy && hasValidBuyPrice,
        // قیمت فروش کاربر = قیمت خرید ادمین (is_visible_buy ادمین)
        is_visible_sell: userIsVisibleSell && hasValidSellPrice,
        has_price: (hasValidBuyPrice || hasValidSellPrice) && (userIsVisibleBuy || userIsVisibleSell),
        updated_at: updatedAt
      };
      
      products.value[index] = updatedProduct;
      products.value = [...products.value];
      
      if (isModalOpen.value && selectedSymbol.value && selectedSymbol.value.code === data.product_code) {
        selectedSymbol.value = { ...updatedProduct };
        currentDisplayPrice.value = getCurrentProductPrice();
        currentDisplayPricePerGram.value = getPricePerGram();
        
        if (quantityValue.value > 0) {
          amountValue.value = calculateAmountFromWeight(quantityValue.value);
          updateAmountDisplayField(amountValue.value);
        } else if (amountValue.value > 0) {
          quantityValue.value = calculateWeightFromAmount(amountValue.value);
          updateQuantityDisplayField(quantityValue.value);
        }
      }
      
      if (isConfirmModalOpen.value && pendingTx.value && pendingTx.value.product_code === data.product_code) {
        const oldPriceValueForCheck = pendingTx.value.price;
        const newPriceValue = finalBuyPrice;
        
        if (oldPriceValueForCheck !== newPriceValue && newPriceValue > 0) {
          showPriceWarning.value = true;
          oldPriceValue.value = oldPriceValueForCheck;
          currentConfirmPrice.value = newPriceValue;
          
          if (selectedSymbol.value?.type === 'melted') {
            currentConfirmAmount.value = calculateAmountFromWeight(pendingTx.value.quantity);
          } else {
            currentConfirmAmount.value = calculateAmountFromCount(pendingTx.value.quantity);
          }
          
          if (warningTimeout) clearTimeout(warningTimeout);
          warningTimeout = setTimeout(() => {
            showPriceWarning.value = false;
          }, 10000);
        }
      }
    }
  });
  
  socketClient.on('products_full_update', (data: any) => {
    if (data.success && data.data) {
      const allProducts = [...(data.data.melted || []), ...(data.data.coins || [])];
      products.value = allProducts.map(normalizeProduct);
    }
  });
  
  socketClient.on('daily_message_updated', (data: any) => {
    dailyMessage.value = data;
    highlightMessage();
  });
  
  socketClient.on('new_notification', (data: any) => {
    showNotificationModal(data);
  });
  
  socketClient.on('transaction_update', (tx: any) => {
    if (String(tx.user_id) === String(user.value?.id)) {
      const index = transactions.value.findIndex(t => t.id === tx.id);
      
      if (index !== -1) {
        const oldStatus = transactions.value[index].status;
        transactions.value[index] = { ...transactions.value[index], ...tx };
        
        if (oldStatus === 'pending' && (tx.status === 'approved' || tx.status === 'rejected' || tx.status === 'expired')) {
          stopTimer();
          showResultModal(transactions.value[index]);
          pendingTransactionId.value = null;
        }
      }
    }
  });
  
  socketClient.on('new_transaction', (tx: any) => {
    if (String(tx.user_id) === String(user.value?.id)) {
      const existingIndex = transactions.value.findIndex(t => t.id === tx.id);
      if (existingIndex === -1) {
        transactions.value = [tx, ...transactions.value];
      }
    }
  });
  
  socketClient.on('transaction_expired', (data: any) => {
    if (String(data.user_id) === String(user.value?.id) || !data.user_id) {
      const index = transactions.value.findIndex(t => t.id === data.id);
      
      if (index !== -1) {
        const oldStatus = transactions.value[index].status;
        
        transactions.value[index] = { 
          ...transactions.value[index], 
          status: 'expired',
          updated_at: data.updated_at || new Date().toISOString()
        };
        
        if (oldStatus === 'pending') {
          stopTimer();
          showResultModal(transactions.value[index]);
          pendingTransactionId.value = null;
        }
      } else {
        const expiredTx = {
          id: data.id,
          user_id: data.user_id || user.value?.id,
          product_code: data.product_code,
          display_name: data.display_name,
          type: data.type,
          amount: data.amount,
          transaction_price: data.transaction_price,
          coin_quantity: data.coin_quantity,
          melted_weight: data.melted_weight,
          status: 'expired',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        };
        transactions.value = [expiredTx, ...transactions.value];
        stopTimer();
        showResultModal(expiredTx);
        pendingTransactionId.value = null;
      }
      
      transactions.value = [...transactions.value];
    }
  });
  
  socketClient.on('disconnect', () => {
    isConnected.value = false;
  });
  
  socketClient.on('connect_error', () => {
    isConnected.value = false;
  });
};

const highlightMessage = () => {
  messageHighlight.value = true;
  if (messageHighlightTimeout) clearTimeout(messageHighlightTimeout);
  messageHighlightTimeout = setTimeout(() => {
    messageHighlight.value = false;
  }, 2000);
};

onMounted(async () => {
  handleResize();
  await loadData();
  await loadDailyMessage();
  initSocket();
  
  setTimeout(() => {
    checkUnseenNotifications();
  }, 1000);
  
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
  if (warningTimeout) clearTimeout(warningTimeout);
  if (messageHighlightTimeout) clearTimeout(messageHighlightTimeout);
  
  if (socket) {
    offAllEvents();
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

.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fb 0%, #eef2f6 100%);
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
}

.hamburger-btn:hover {
  background: #e8edf2;
}

.hamburger-icon {
  font-size: 24px;
  color: #4a5568;
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
}

.user-name-header {
  font-weight: 500;
  color: #64748b;
  font-size: 13px;
}

.connection-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
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

.daily-message-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 0 32px 24px 32px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  transition: all 0.2s;
}

.daily-message-card.message-updated {
  animation: messageFlash 0.5s ease;
}

@keyframes messageFlash {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); box-shadow: 0 12px 30px rgba(102, 126, 234, 0.5); }
  100% { transform: scale(1); }
}

.message-icon {
  font-size: 32px;
}

.message-content {
  flex: 1;
}

.message-line {
  margin: 4px 0;
  font-size: 14px;
  line-height: 1.6;
  color: white;
  text-align: center;
}

.message-content small {
  display: block;
  margin-top: 8px;
  font-size: 11px;
  opacity: 0.8;
  color: rgba(255,255,255,0.9);
}

.price-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 0 12px 0;
  margin: 0 24px 0 24px;
  border-bottom: 2px solid #e2e8f0;
}

.price-header-buy,
.price-header-sell {
  flex: 1;
  text-align: center;
  font-size: 15px;
  font-weight: 800;
}

.price-header-buy {
  color: #2563eb;
}

.price-header-sell {
  color: #dc2626;
}

.price-header-name {
  flex: 0 0 auto;
  min-width: 200px;
  text-align: center;
  font-size: 15px;
  font-weight: 800;
  color: #64748b;
}

.sub-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 8px 24px 16px 24px;
  padding: 8px 0;
}

.sub-header-buy,
.sub-header-sell {
  flex: 1;
}

.sub-header-name {
  flex: 0 0 auto;
  min-width: 200px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.sub-label {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.sub-time {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  font-family: monospace;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 20px;
}

.products-section {
  margin: 0 24px 16px 24px;
}

.product-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: transparent;
  padding: 12px 20px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.product-row:hover {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
}

.product-buy {
  flex: 1;
  text-align: center;
  padding: 10px 8px;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: all 0.2s;
}

.product-buy:hover {
  background: #eff6ff;
  transform: scale(1.02);
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.15);
  border-color: #2563eb;
}

.product-buy .price-value {
  font-size: 15px;
  font-weight: 700;
  display: block;
}

.buy-price {
  color: #2563eb !important;
}

.product-buy.empty {
  background: white;
  cursor: default;
}

.product-buy.empty:hover {
  background: white;
  transform: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  border-color: #e2e8f0;
}

.product-sell {
  flex: 1;
  text-align: center;
  padding: 10px 8px;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: all 0.2s;
}

.product-sell:hover {
  background: #fef2f2;
  transform: scale(1.02);
  box-shadow: 0 4px 10px rgba(220, 38, 38, 0.15);
  border-color: #dc2626;
}

.product-sell .price-value {
  font-size: 15px;
  font-weight: 700;
  display: block;
}

.sell-price {
  color: #dc2626 !important;
}

.product-sell.empty {
  background: white;
  cursor: default;
}

.product-sell.empty:hover {
  background: white;
  transform: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  border-color: #e2e8f0;
}

.empty-price {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
}

.product-name {
  flex: 0 0 auto;
  text-align: center;
  min-width: 200px;
}

.product-name h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.loading-state {
  text-align: center;
  padding: 60px;
  color: #999;
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

.transactions-section {
  margin: 32px 24px 40px 24px;
}

.section-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.transactions-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 8px 24px;
  border-radius: 40px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
  white-space: nowrap;
}

.title-icon {
  font-size: 18px;
}

.title-text {
  font-size: 14px;
  font-weight: 700;
  color: #374151;
}

.title-count {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.transaction-card {
  background: white;
  border-radius: 20px;
  padding: 18px 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  border-right: 4px solid;
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
  margin-bottom: 12px;
  overflow-x: auto;
  overflow-y: hidden;
}

.card-header::-webkit-scrollbar {
  display: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.transaction-type-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
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
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

.transaction-time {
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 20px;
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

.status-badge.status-expired {
  background: #e2e8f0;
  color: #64748b;
}

.status-badge.status-expired .status-dot {
  background: #94a3b8;
}

.timer-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-family: monospace;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.timer-badge.warning {
  background: #fef3c7;
  color: #d97706;
  animation: pulse 1s infinite;
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
}

.description-text strong {
  color: #1e293b;
  font-weight: 700;
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
}

.sidebar-user-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-container {
  background: white;
  border-radius: 28px;
  width: 450px;
  max-width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  animation: modalFadeIn 0.2s ease;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  padding: 24px 24px 0 24px;
  border-bottom: none;
}

.modal-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.type-badge-buy {
  background: #2563eb;
  color: white;
  padding: 6px 16px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 700;
}

.type-badge-sell {
  background: #dc2626;
  color: white;
  padding: 6px 16px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 700;
}

.product-name-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.modal-body {
  padding: 20px 24px 24px 24px;
}

.price-info {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 24px;
}

.price-item {
  flex: 1;
  text-align: center;
}

.price-item .price-label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
  font-weight: 500;
}

.price-item .price-value {
  font-size: 18px;
  font-weight: 800;
}

.buy-price-text {
  color: #2563eb;
}

.sell-price-text {
  color: #dc2626;
}

.input-group {
  margin-bottom: 16px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 0 16px;
  transition: all 0.2s;
}

.input-wrapper:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-wrapper.disabled {
  background: #f1f5f9;
  opacity: 0.8;
}

.main-input {
  flex: 1;
  padding: 16px 0;
  border: none;
  background: transparent;
  font-size: 16px;
  outline: none;
  font-family: inherit;
}

.text-center {
  text-align: center;
}

.main-input::placeholder {
  color: #cbd5e1;
  font-size: 14px;
  text-align: center;
}

.disabled-input {
  color: #1e293b;
  cursor: not-allowed;
}

.input-unit {
  color: #94a3b8;
}

.amount-wrapper {
  background: linear-gradient(135deg, #667eea08, #764ba208);
  border-color: #667eea30;
}

.amount-input {
  font-weight: 700;
  font-size: 18px;
  color: #1e293b;
}

.limits-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f8fafc;
  border-radius: 14px;
  padding: 12px 20px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.limit-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.limit-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.limit-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.limit-divider {
  width: 1px;
  height: 20px;
  background: #e2e8f0;
}

.error-msg {
  color: #dc2626;
  text-align: center;
  margin-bottom: 16px;
  padding: 10px;
  background: #fef2f2;
  border-radius: 12px;
  font-size: 12px;
}

.modal-buttons {
  display: flex;
  gap: 12px;
}

.btn-primary {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  flex: 1;
  background: #f1f5f9;
  color: #475569;
  border: none;
  padding: 14px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.confirm-modal {
  width: 400px;
}

.confirm-details {
  margin-bottom: 20px;
  background: #f8fafc;
  border-radius: 16px;
  padding: 6px 16px;
}

.confirm-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
}

.confirm-row:last-child {
  border-bottom: none;
}

.amount-highlight {
  color: #8b5cf6;
  font-size: 18px;
}

.price-warning-box {
  background: #1e293b;
  border-radius: 16px;
  margin: 16px 20px 0 20px;
  padding: 14px 16px;
  animation: shakeWarning 0.3s ease;
}

@keyframes shakeWarning {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

.warning-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
}

.warning-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #475569, #475569, transparent);
  margin: 8px 0;
}

.warning-details {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 10px 0;
  font-size: 13px;
}

.warning-details .old-price {
  color: #cbd5e1;
}

.warning-details .new-price {
  color: #ffffff;
  font-weight: 700;
}

.fade-warning-enter-active,
.fade-warning-leave-active {
  transition: opacity 0.3s ease;
}

.fade-warning-enter-from,
.fade-warning-leave-to {
  opacity: 0;
}

.timer-modal {
  background: white;
  border-radius: 28px;
  padding: 40px;
  text-align: center;
  width: 300px;
}

.timer-circle {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 auto 20px;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.timer-number {
  font-size: 42px;
  font-weight: 800;
  color: white;
  font-family: monospace;
}

.timer-label {
  color: rgba(255,255,255,0.7);
  font-size: 12px;
}

.timer-text {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #1e293b;
}

.timer-subtext {
  color: #94a3b8;
  font-size: 12px;
}

.result-modal {
  width: 450px;
  max-width: 90%;
}

.result-header {
  padding: 20px 24px;
  border-radius: 28px 28px 0 0;
  background: linear-gradient(135deg, #f8fafc, #f8fafc);
}

.result-header.result-header-approved {
  background: linear-gradient(135deg, #f8fafc, #f8fafc);
}

.result-header.result-header-rejected {
  background: linear-gradient(135deg, #f8fafc, #f8fafc);
}

.result-header.result-header-expired {
  background: linear-gradient(135deg, #f8fafc, #f8fafc);
}

.result-header .modal-title {
  border-bottom: none;
  padding-bottom: 0;
}

.result-body {
  padding: 24px;
  text-align: center;
}

.result-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 40px;
  font-weight: bold;
}

.result-icon-approved {
  background: #dcfce7;
  color: #22c55e;
}

.result-icon-rejected {
  background: #fee2e2;
  color: #ef4444;
}

.result-icon-expired {
  background: #fef3c7;
  color: #f59e0b;
}

.result-message {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16px;
}

.result-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e8f0, #e2e8f0, transparent);
  margin: 16px 0;
}

.result-details {
  background: #f8fafc;
  border-radius: 16px;
  padding: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.detail-label {
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  color: #1e293b;
  font-weight: 700;
}

.amount-value {
  color: #8b5cf6;
  font-size: 16px;
}

.result-date {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 12px;
  color: #64748b;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
}

.result-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.retry-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.retry-btn:hover {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.notification-modal {
  width: 500px;
  max-width: 90%;
}

.notification-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 24px;
  border-radius: 28px 28px 0 0;
}

.notification-header.header-success {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.notification-header.header-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.notification-header.header-error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.notification-header.header-info {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.notification-header.header-simple {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.notification-header .modal-title {
  border-bottom: none;
  padding-bottom: 0;
  gap: 10px;
}

.notification-header .modal-title .message-header-icon {
  font-size: 28px;
}

.notification-header .modal-title .message-header-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
}

.notification-body {
  padding: 24px;
}

.notification-content {
  background: #f8fafc;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.notification-text {
  line-height: 1.8;
  text-align: center;
}

.notification-line {
  margin: 12px 0;
  font-size: 15px;
  color: #1e293b;
  text-align: center;
  line-height: 1.8;
}

.understood-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Responsive */
@media (max-width: 768px) {
  .header-container { padding: 0 16px; height: 70px; }
  .user-role-header { font-size: 16px; }
  .user-name-header { font-size: 11px; }
  .divider-section { margin: 12px 16px 20px; gap: 12px; }
  .date-box { padding: 6px 16px; }
  .date-text { font-size: 11px; }
  .daily-message-card { margin: 0 16px 20px 16px; padding: 12px 16px; gap: 12px; }
  .message-icon { font-size: 24px; }
  .message-line { font-size: 11px; }
  .price-header { margin: 0 16px 0 16px; }
  .price-header-buy, .price-header-sell { font-size: 12px; }
  .price-header-name { font-size: 12px; min-width: 100px; }
  .sub-header { margin: 8px 16px 12px 16px; }
  .sub-header-name { min-width: 100px; gap: 6px; }
  .sub-label { font-size: 11px; }
  .sub-time { font-size: 10px; padding: 2px 8px; }
  .products-section { margin: 0 16px 12px 16px; }
  .product-row { padding: 10px 12px; gap: 10px; }
  .product-buy .price-value, .product-sell .price-value { font-size: 12px; }
  .product-name { min-width: 80px; }
  .product-name h3 { font-size: 11px; }
  .empty-price { font-size: 11px; }
  .transactions-section { margin: 24px 16px 32px 16px; }
  .transactions-title-box { padding: 6px 16px; }
  .title-text { font-size: 12px; }
  .title-count { width: 20px; height: 20px; font-size: 10px; }
  .transaction-card { padding: 14px 16px; }
  .card-header { gap: 8px; overflow-x: auto; padding-bottom: 4px; }
  .header-left { gap: 8px; }
  .header-right { gap: 8px; }
  .transaction-type-badge { padding: 3px 10px; font-size: 11px; }
  .transaction-product-name { font-size: 12px; }
  .transaction-time { font-size: 10px; padding: 3px 8px; }
  .status-badge { padding: 3px 8px; font-size: 10px; }
  .timer-badge { padding: 3px 8px; font-size: 10px; }
  .description-text { font-size: 11px; }
  .result-modal { width: 95%; }
  .result-icon { width: 60px; height: 60px; font-size: 30px; }
  .result-message { font-size: 16px; }
  .detail-row { font-size: 12px; }
  .result-date { font-size: 10px; gap: 8px; }
  .notification-modal { width: 95%; }
  .notification-header { padding: 16px 20px; }
  .notification-header .modal-title .message-header-icon { font-size: 24px; }
  .notification-header .modal-title .message-header-title { font-size: 16px; }
  .notification-body { padding: 20px; }
  .notification-content { padding: 16px; }
  .notification-line { font-size: 13px; margin: 8px 0; }
  .modal-container { width: 90%; max-height: 80vh; }
  .price-item .price-value { font-size: 16px; }
  .price-info { gap: 12px; }
  .limits-row { gap: 8px; padding: 10px 12px; }
  .limit-label { font-size: 10px; }
  .limit-value { font-size: 11px; }
  .amount-input { font-size: 16px; }
  .price-warning-box { margin: 12px 12px 0 12px; padding: 10px 12px; }
  .warning-title { font-size: 12px; }
  .warning-details { gap: 12px; font-size: 11px; }
}
</style>