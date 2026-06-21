<!-- frontend/src/layouts/AdminLayout.vue -->
<template>
  <div class="admin-layout">
    <!-- دکمه همبرگری - همیشه شناور -->
    <button @click="toggleSidebar" class="hamburger-btn" :class="{ active: isSidebarOpen }">
      <svg 
        v-if="!isSidebarOpen" 
        class="hamburger-svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
      <svg 
        v-else 
        class="hamburger-svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
      <span v-if="totalNewItems > 0" class="badge">
        {{ totalNewItems > 99 ? '99+' : totalNewItems }}
      </span>
    </button>

    <!-- سایدبار -->
    <aside :class="['sidebar', { 'sidebar-open': isSidebarOpen }]">
      <div class="sidebar-header">
        <div class="logo">
          <h2>پنل مدیریت</h2>
        </div>
      </div>
      
      <nav class="nav">
        <router-link to="/admin/users" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">👥</span>
          <span class="nav-text">کاربران</span>
        </router-link>
        
        <router-link to="/admin/admins" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">👨‍💼</span>
          <span class="nav-text">ادمین‌ها</span>
        </router-link>
        
        <router-link to="/admin/registrations" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">📝</span>
          <span class="nav-text">درخواست‌ها</span>
          <span v-if="newRegistrations > 0" class="nav-badge">{{ newRegistrations > 99 ? '99+' : newRegistrations }}</span>
        </router-link>
        
        <router-link to="/admin/products" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">🏷️</span>
          <span class="nav-text">مدیریت محصولات</span>
        </router-link>
        
        <router-link to="/admin/prices-management" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">💰</span>
          <span class="nav-text">مدیریت قیمت‌ها</span>
          <span v-if="newTransactions > 0" class="nav-badge">{{ newTransactions > 99 ? '99+' : newTransactions }}</span>
        </router-link>
        
        <router-link to="/admin/transactions" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">💳</span>
          <span class="nav-text">مدیریت تراکنش‌ها</span>
        </router-link>
        
        <router-link to="/admin/riz-management" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">📊</span>
          <span class="nav-text">مدیریت ریزحساب</span>
        </router-link>

        <router-link to="/admin/remittances" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">📦</span>
          <span class="nav-text">مدیریت حواله‌ها</span>
          <span v-if="newRemittances > 0" class="nav-badge">{{ newRemittances > 99 ? '99+' : newRemittances }}</span>
        </router-link>

        <router-link to="/admin/timers" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">⏱️</span>
          <span class="nav-text">مدیریت تایمرها</span>
        </router-link>

        <router-link to="/admin/notifications" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">🔔</span>
          <span class="nav-text">مدیریت اعلان‌ها</span>
        </router-link>

        <router-link to="/admin/descriptions" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">📝</span>
          <span class="nav-text">مدیریت توضیحات</span>
        </router-link>
        
        <router-link to="/admin/terms-management" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">📜</span>
          <span class="nav-text">مدیریت شرایط و قوانین</span>
        </router-link>

        <router-link to="/admin/backup" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">💾</span>
          <span class="nav-text">مدیریت بکاپ</span>
        </router-link>

        <div class="divider"></div>
        
        <router-link to="/dashboard" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">📊</span>
          <span class="nav-text">بازگشت به داشبورد</span>
        </router-link>

        <button @click="handleLogout" class="nav-link logout">
          <span class="nav-icon">🚪</span>
          <span class="nav-text">خروج</span>
        </button>
      </nav>
    </aside>

    <!-- اوورلی برای بستن سایدبار -->
    <div v-if="isSidebarOpen" class="overlay" @click="closeSidebar"></div>

    <!-- نوتیفیکیشن لحظه‌ای -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <div class="notification-content">
        <span class="notification-icon">{{ notification.icon }}</span>
        <div class="notification-text">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
        </div>
        <button @click="closeNotification" class="notification-close">✕</button>
      </div>
    </div>

    <!-- محتوای اصلی -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/auth/stores/authStore';
import { connectSocket } from '@/core/socket/socket.io';

const router = useRouter();
const authStore = useAuthStore();
const isSidebarOpen = ref(false);
let socketInstance: any = null;
let isListenersRegistered = false;

// ============== وضعیت نوتیفیکیشن‌ها ==============
const newRemittances = ref(0);
const newTransactions = ref(0);
const newRegistrations = ref(0);
const totalNewItems = computed(() => newRemittances.value + newTransactions.value + newRegistrations.value);

// ============== مدیریت تراکنش‌های پردازش شده ==============
const processedTransactions = new Set<number>();

// ============== نوتیفیکیشن لحظه‌ای ==============
const notification = ref({
  show: false,
  type: 'info',
  icon: '🔔',
  title: '',
  message: '',
  timeout: null as ReturnType<typeof setTimeout> | null
});

// ============== توابع نوتیفیکیشن ==============

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 1108.73;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.2, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.2);
    }, 150);
  } catch (error) {
    console.warn('Error playing notification sound:', error);
  }
};

const showNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  const titles = {
    info: 'اطلاعات',
    success: 'موفقیت',
    warning: 'هشدار',
    error: 'خطا'
  };
  
  playNotificationSound();
  
  if (notification.value.timeout) {
    clearTimeout(notification.value.timeout);
  }
  
  notification.value = {
    show: true,
    type,
    icon: icons[type] || '🔔',
    title: title || titles[type],
    message,
    timeout: null
  };
  
  notification.value.timeout = setTimeout(() => {
    closeNotification();
  }, 5000);
};

const closeNotification = () => {
  notification.value.show = false;
  if (notification.value.timeout) {
    clearTimeout(notification.value.timeout);
    notification.value.timeout = null;
  }
};

// ============== توابع کمکی برای فرمت کردن اطلاعات تراکنش ==============

const getTransactionDetails = (data: any): string => {
  const parts = [];
  
  let userName = 'کاربر';
  if (data.user_name) {
    userName = data.user_name;
  } else if (data.user?.full_name) {
    userName = data.user.full_name;
  } else if (data.user?.first_name || data.user?.last_name) {
    userName = `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim();
  } else if (data.user?.code) {
    userName = data.user.code;
  } else if (data.user_id) {
    userName = `کاربر ${data.user_id}`;
  }
  parts.push(`👤 ${userName}`);
  
  const symbol = data.display_name || data.product_code || 'نامشخص';
  parts.push(`📊 ${symbol}`);
  
  if (data.amount) {
    parts.push(`💰 ${Number(data.amount).toLocaleString()} تومان`);
  }
  
  if (data.melted_weight) {
    parts.push(`⚖️ ${data.melted_weight} گرم`);
  }
  
  if (data.coin_quantity) {
    parts.push(`🪙 ${data.coin_quantity} عدد`);
  }
  
  const type = data.type === 'خرید' || data.type === 'buy' ? 'خرید' : 'فروش';
  parts.push(`📈 ${type}`);
  
  return parts.join(' | ');
};

const getRemittanceDetails = (data: any): string => {
  const parts = [];
  
  let userName = 'کاربر';
  if (data.user_name) {
    userName = data.user_name;
  } else if (data.user?.full_name) {
    userName = data.user.full_name;
  } else if (data.user?.first_name || data.user?.last_name) {
    userName = `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim();
  }
  parts.push(`👤 ${userName}`);
  
  const code = data.remittance_code || data.id || 'نامشخص';
  parts.push(`📦 ${code}`);
  
  if (data.amount) {
    parts.push(`💰 ${Number(data.amount).toLocaleString()} تومان`);
  }
  
  if (data.recipient) {
    parts.push(`📨 ${data.recipient}`);
  }
  
  return parts.join(' | ');
};

// ============== مدیریت رویدادهای WebSocket ==============

// 🔹 رویداد: تراکنش جدید (new_transaction)
const handleNewTransaction = (data: any) => {
  console.log('💳 تراکنش جدید (new_transaction):', data);
  
  // جلوگیری از پردازش تکراری
  if (data.id && processedTransactions.has(data.id)) {
    console.log(`⚠️ تراکنش ${data.id} قبلاً پردازش شده است`);
    return;
  }
  
  const isPending = data.status === 'pending' || data.status === 'new';
  
  if (isPending) {
    if (data.id) {
      processedTransactions.add(data.id);
    }
    
    newTransactions.value++;
    console.log(`🔢 تعداد تراکنش‌های جدید: ${newTransactions.value}`);
    
    const details = getTransactionDetails(data);
    showNotification('💳 تراکنش جدید', details, 'warning');
  }
};

// 🔹 رویداد: به‌روزرسانی تراکنش (transaction_update)
const handleTransactionUpdate = (data: any) => {
  console.log('💳 به‌روزرسانی تراکنش (transaction_update):', data);
  
  if (data.status === 'approved' || data.status === 'rejected' || data.status === 'expired') {
    if (data.id && processedTransactions.has(data.id)) {
      processedTransactions.delete(data.id);
    }
    
    if (newTransactions.value > 0) {
      newTransactions.value--;
      console.log(`🔢 تعداد تراکنش‌های جدید: ${newTransactions.value}`);
    }
    
    const details = getTransactionDetails(data);
    
    if (data.status === 'approved') {
      showNotification('✅ تراکنش تایید شد', details, 'success');
    } else if (data.status === 'rejected') {
      showNotification('❌ تراکنش رد شد', details, 'error');
    } else if (data.status === 'expired') {
      showNotification('⏰ تراکنش منقضی شد', details, 'error');
    }
  }
};

// 🔹 رویداد: انقضای تراکنش (transaction_expired)
const handleTransactionExpired = (data: any) => {
  console.log('⏰ تراکنش منقضی شد (transaction_expired):', data);
  
  if (data.id && processedTransactions.has(data.id)) {
    processedTransactions.delete(data.id);
  }
  
  if (newTransactions.value > 0) {
    newTransactions.value--;
    console.log(`🔢 تعداد تراکنش‌های جدید: ${newTransactions.value}`);
  }
  
  const details = getTransactionDetails(data);
  showNotification('⏰ تراکنش منقضی شد', details, 'error');
};

// 🔹 رویداد: حواله جدید (new_remittance)
const handleNewRemittance = (data: any) => {
  console.log('📦 حواله جدید (new_remittance):', data);
  
  if (data.status === 'pending' || data.status === 'new') {
    newRemittances.value++;
    console.log(`🔢 تعداد حواله‌های جدید: ${newRemittances.value}`);
    
    const details = getRemittanceDetails(data);
    showNotification('📦 حواله جدید', details, 'info');
  }
};

// 🔹 رویداد: به‌روزرسانی وضعیت حواله (remittance_status_update)
const handleRemittanceStatusUpdate = (data: any) => {
  console.log('📦 به‌روزرسانی حواله (remittance_status_update):', data);
  
  if (data.status === 'approved' || data.status === 'confirmed' || 
      data.status === 'rejected' || data.status === 'cancelled') {
    if (newRemittances.value > 0) {
      newRemittances.value--;
      console.log(`🔢 تعداد حواله‌های جدید: ${newRemittances.value}`);
    }
    
    const details = getRemittanceDetails(data);
    
    if (data.status === 'approved' || data.status === 'confirmed') {
      showNotification('✅ حواله تایید شد', details, 'success');
    } else if (data.status === 'rejected' || data.status === 'cancelled') {
      showNotification('❌ حواله رد شد', details, 'error');
    }
  }
};

// ============== توابع سایدبار ==============

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
  if (isSidebarOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
  document.body.style.overflow = '';
};

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

const handleEsc = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isSidebarOpen.value) {
    closeSidebar();
  }
};

const handleResize = () => {
  if (window.innerWidth >= 1024 && isSidebarOpen.value) {
    closeSidebar();
  }
};

// ============== لایف‌سایکل ==============

onMounted(() => {
  window.addEventListener('keydown', handleEsc);
  window.addEventListener('resize', handleResize);
  
  // جلوگیری از ثبت دوباره لیسنرها
  if (isListenersRegistered) {
    console.log('⚠️ Listeners already registered, skipping...');
    return;
  }
  
  try {
    const socket = connectSocket();
    socketInstance = socket;
    console.log('🔌 Socket connected:', socket.connected);
    
    // اتصال به روم ادمین
    if (socket.connected) {
      socket.emit('join-admin');
      console.log('👑 Admin joined admin_room');
    } else {
      socket.once('connect', () => {
        socket.emit('join-admin');
        console.log('👑 Admin joined admin_room (after connect)');
      });
    }
    
    // حذف لیسنرهای قبلی (اگر وجود داشته باشند)
    socket.off('new_transaction');
    socket.off('transaction_update');
    socket.off('transaction_expired');
    socket.off('new_remittance');
    socket.off('remittance_status_update');
    
    // تنظیم لیسنرها
    socket.on('new_transaction', handleNewTransaction);
    socket.on('transaction_update', handleTransactionUpdate);
    socket.on('transaction_expired', handleTransactionExpired);
    socket.on('new_remittance', handleNewRemittance);
    socket.on('remittance_status_update', handleRemittanceStatusUpdate);
    
    // لیسنر برای دیباگ - تمام رویدادها
    socket.onAny((event: string, ...args: any[]) => {
      if (event.startsWith('new_') || event.startsWith('transaction_') || event.startsWith('remittance_')) {
        console.log(`📡 دریافت رویداد: ${event}`, args[0]);
      }
    });
    
    isListenersRegistered = true;
    console.log('✅ WebSocket connected for admin notifications');
    console.log('📡 Listening to: new_transaction, transaction_update, transaction_expired, new_remittance, remittance_status_update');
  } catch (error) {
    console.error('❌ WebSocket connection error:', error);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEsc);
  window.removeEventListener('resize', handleResize);
  
  // پاکسازی Socket.IO
  if (socketInstance) {
    socketInstance.off('new_transaction', handleNewTransaction);
    socketInstance.off('transaction_update', handleTransactionUpdate);
    socketInstance.off('transaction_expired', handleTransactionExpired);
    socketInstance.off('new_remittance', handleNewRemittance);
    socketInstance.off('remittance_status_update', handleRemittanceStatusUpdate);
    socketInstance.offAny();
    socketInstance = null;
  }
  
  isListenersRegistered = false;
  processedTransactions.clear();
  
  closeNotification();
  document.body.style.overflow = '';
});
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
}

/* ========== دکمه همبرگری - همیشه شناور ========== */
.hamburger-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  z-index: 1003;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 20px;
  right: 20px;
}

.hamburger-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 25px rgba(139, 92, 246, 0.6);
  background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
}

.hamburger-btn:active {
  transform: scale(0.95);
}

.hamburger-svg {
  width: 28px;
  height: 28px;
  color: white;
  transition: all 0.3s ease;
}

.hamburger-btn.active .hamburger-svg {
  transform: rotate(90deg);
}

/* نشانگر تعداد روی دکمه همبرگری */
.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #EF4444;
  color: white;
  font-size: 11px;
  font-weight: bold;
  min-width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border: 2px solid white;
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

/* ========== نشانگرهای داخل سایدبار ========== */
.nav-badge {
  background: #EF4444;
  color: white;
  font-size: 11px;
  font-weight: bold;
  min-width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  animation: badgePulse 2s ease-in-out infinite;
}

/* ========== سایدبار ========== */
.sidebar {
  position: fixed;
  top: 0;
  right: -300px;
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  z-index: 1002;
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 10px rgba(0,0,0,0.2);
  overflow-y: auto;
}

.sidebar-open {
  right: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 16px;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
  text-align: center;
}

/* ناوبری */
.nav {
  display: flex;
  flex-direction: column;
  padding: 0 0 20px;
  flex: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  transition: all 0.3s;
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  text-align: right;
  font-size: 15px;
  position: relative;
}

.nav-link:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.nav-link.router-link-active {
  background: rgba(139, 92, 246, 0.2);
  color: white;
  border-right: 3px solid #8B5CF6;
}

.nav-icon {
  font-size: 20px;
  width: 28px;
  text-align: center;
}

.nav-text {
  flex: 1;
}

.divider {
  height: 1px;
  background: rgba(255,255,255,0.1);
  margin: 12px 20px;
}

.logout {
  margin-top: auto;
  border-top: 1px solid rgba(255,255,255,0.1);
  color: #EF4444;
}

.logout:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* محتوای اصلی */
.main-content {
  flex: 1;
  background: #f5f6fa;
  min-height: 100vh;
  padding: 20px;
  width: 100%;
}

/* اوورلی */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1001;
  backdrop-filter: blur(2px);
}

/* ========== نوتیفیکیشن لحظه‌ای ========== */
.notification {
  position: fixed;
  top: 80px;
  left: 20px;
  z-index: 1100;
  min-width: 320px;
  max-width: 450px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
  border-right: 4px solid #8B5CF6;
  animation: slideInRight 0.5s ease;
  overflow: hidden;
}

.notification.info {
  border-right-color: #8B5CF6;
}

.notification.success {
  border-right-color: #10B981;
}

.notification.warning {
  border-right-color: #F59E0B;
}

.notification.error {
  border-right-color: #EF4444;
}

@keyframes slideInRight {
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px;
}

.notification-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.notification-text {
  flex: 1;
}

.notification-title {
  font-weight: bold;
  font-size: 15px;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: #555;
  line-height: 1.4;
  word-break: break-word;
}

.notification-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  transition: color 0.3s;
  flex-shrink: 0;
}

.notification-close:hover {
  color: #333;
}

/* ========== ریسپانسیو ========== */
@media (min-width: 1024px) {
  .hamburger-btn {
    top: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
  }
  
  .hamburger-svg {
    width: 30px;
    height: 30px;
  }
  
  .sidebar {
    width: 280px;
  }
  
  .main-content {
    padding: 80px 24px 24px 24px;
  }
  
  .notification {
    left: 320px;
    top: 20px;
  }
}

@media (max-width: 1023px) {
  .hamburger-btn {
    top: 16px;
    right: 16px;
    width: 48px;
    height: 48px;
  }
  
  .hamburger-svg {
    width: 28px;
    height: 28px;
  }
  
  .sidebar {
    width: 280px;
  }
  
  .main-content {
    padding: 80px 16px 16px 16px;
  }
  
  .notification {
    left: 20px;
    right: 20px;
    min-width: unset;
    max-width: unset;
  }
}

@media (max-width: 767px) {
  .hamburger-btn {
    top: 12px;
    right: 12px;
    width: 44px;
    height: 44px;
    border-radius: 10px;
  }
  
  .hamburger-svg {
    width: 24px;
    height: 24px;
  }
  
  .sidebar {
    width: 260px;
  }
  
  .main-content {
    padding: 68px 12px 12px 12px;
  }
  
  .notification {
    left: 10px;
    right: 10px;
    min-width: unset;
    max-width: unset;
    top: 64px;
  }
  
  .notification-content {
    padding: 12px 14px;
  }
  
  .notification-icon {
    font-size: 22px;
  }
  
  .notification-title {
    font-size: 14px;
  }
  
  .notification-message {
    font-size: 12px;
  }
}
</style>