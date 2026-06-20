<!-- frontend/src/layouts/AdminLayout.vue -->
<template>
  <div class="admin-layout">
    <!-- دکمه همبرگری -->
    <button @click="toggleSidebar" class="hamburger-btn" :class="{ active: isSidebarOpen }">
      <span class="hamburger-icon">☰</span>
      <span class="close-icon">✕</span>
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
        </router-link>
        
        <router-link to="/admin/products" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">🏷️</span>
          <span class="nav-text">مدیریت محصولات</span>
        </router-link>
        
        <router-link to="/admin/prices-management" class="nav-link" @click="closeSidebar">
          <span class="nav-icon">💰</span>
          <span class="nav-text">مدیریت قیمت‌ها</span>
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

    <!-- محتوای اصلی -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/auth/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();
const isSidebarOpen = ref(false);

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

onMounted(() => {
  window.addEventListener('keydown', handleEsc);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleEsc);
  window.removeEventListener('resize', handleResize);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  position: relative;
}

/* ========== دکمه همبرگری ========== */
.hamburger-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  z-index: 1003;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hamburger-btn:hover {
  transform: scale(1.05);
  background: linear-gradient(135deg, #2a2a3e 0%, #26314e 100%);
}

.hamburger-icon,
.close-icon {
  font-size: 28px;
  color: white;
  position: absolute;
  transition: all 0.3s ease;
}

.hamburger-icon {
  opacity: 1;
  transform: rotate(0deg);
}

.close-icon {
  opacity: 0;
  transform: rotate(90deg);
}

.hamburger-btn.active .hamburger-icon {
  opacity: 0;
  transform: rotate(-90deg);
}

.hamburger-btn.active .close-icon {
  opacity: 1;
  transform: rotate(0deg);
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
  transition: right 0.3s ease;
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
}

.nav-link:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.nav-link.router-link-active {
  background: rgba(255,255,255,0.15);
  color: white;
  border-right: 3px solid #667eea;
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
  color: #e74c3c;
}

.logout:hover {
  background: rgba(231, 76, 60, 0.2);
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

/* ========== ریسپانسیو ========== */
@media (min-width: 1024px) {
  .hamburger-btn {
    display: flex;
    top: 20px;
    right: 20px;
  }
  
  .sidebar {
    width: 280px;
  }
  
  .main-content {
    padding: 80px 24px 24px 24px;
  }
}

@media (max-width: 1023px) {
  .sidebar {
    width: 280px;
  }
  
  .main-content {
    padding: 80px 16px 16px 16px;
  }
}
</style>