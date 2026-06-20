// frontend/src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/modules/auth/stores/authStore';

let isChecking = false;
let lastCheckTime = 0;
const CHECK_INTERVAL = 5000;

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/modules/auth/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/verify-otp',
      name: 'VerifyOtp',
      component: () => import('@/modules/auth/views/VerifyOtpView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/modules/dashboard/views/DashboardView.vue'),
      meta: { requiresAuth: true, noLayout: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/DefaultLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'transactions',
          name: 'Transactions',
          component: () => import('@/modules/transaction/views/TransactionsView.vue'),
        },
        {
          path: 'user-products',
          name: 'UserProducts',
          component: () => import('@/modules/price/views/UserProductsView.vue'),
        },
        {
          path: 'balance',
          name: 'Balance',
          component: () => import('@/modules/riz/views/BalanceView.vue'),
          meta: { title: 'مانده حساب' }
        },
        {
          path: 'remittances',
          name: 'Remittances',
          component: () => import('@/modules/remittance/views/RemittancesView.vue'),
        },
        {
          path: 'notifications',
          name: 'Notifications',
          component: () => import('@/modules/notification/views/NotificationView.vue'),
          meta: { title: 'اعلان‌ها' }
        },
        {
          path: 'support',
          name: 'Support',
          component: () => import('@/modules/support/views/SupportView.vue'),
          meta: { title: 'پشتیبانی' }
        },
        {
          path: 'terms',
          name: 'Terms',
          component: () => import('@/modules/support/views/TermsView.vue'),
          meta: { title: 'شرایط و قوانین' }
        },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: 'users',
          name: 'AdminUsers',
          component: () => import('@/modules/admin/views/UsersView.vue'),
        },
        {
          path: 'admins',
          name: 'AdminAdmins',
          component: () => import('@/modules/admin/views/AdminsView.vue'),
        },
        {
          path: 'registrations',
          name: 'AdminRegistrations',
          component: () => import('@/modules/admin/views/RegistrationsView.vue'),
        },
        {
          path: 'products',
          name: 'AdminProducts',
          component: () => import('@/modules/price/views/ProductsView.vue'),
        },
        {
          path: 'prices-management',
          name: 'PricesManagement',
          component: () => import('@/modules/price/views/PricesManagementView.vue'),
        },
        {
          path: 'riz-management',
          name: 'RizManagement',
          component: () => import('@/modules/admin/views/RizManagementView.vue'),
        },
        {
          path: 'transactions',
          name: 'AdminTransactions',
          component: () => import('@/modules/admin/views/AdminTransactionsView.vue'),
        },
        {
          path: 'remittances',
          name: 'AdminRemittances',
          component: () => import('@/modules/admin/views/AdminRemittancesView.vue'),
        },
        {
          path: 'timers',
          name: 'AdminTimers',
          component: () => import('@/modules/admin/views/AdminTimersView.vue'),
          meta: { title: 'مدیریت تایمرها' }
        },
        {
          path: 'notifications',
          name: 'AdminNotifications',
          component: () => import('@/modules/admin/views/AdminNotificationsView.vue'),
          meta: { title: 'مدیریت اعلان‌ها' }
        },
        {
          path: 'descriptions',
          name: 'AdminDescriptions',
          component: () => import('@/modules/support/views/AdminDescriptionsView.vue'),
          meta: { title: 'مدیریت توضیحات صفحات' }
        },
        {
          path: 'terms-management',
          name: 'AdminTerms',
          component: () => import('@/modules/support/views/AdminTermsView.vue'),
          meta: { title: 'مدیریت شرایط و قوانین' }
        },
        {
          path: 'backup',
          name: 'AdminBackup',
          component: () => import('@/modules/admin/views/AdminBackupView.vue'),
          meta: { title: 'مدیریت بکاپ' }
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const now = Date.now();
  
  if (!authStore.isAuthenticated && !isChecking && (now - lastCheckTime) > CHECK_INTERVAL) {
    isChecking = true;
    lastCheckTime = now;
    await authStore.checkSession();
    isChecking = false;
  }
  
  const isAuthenticated = authStore.isAuthenticated;
  const requiresAuth = to.meta.requiresAuth !== false;
  const requiresAdmin = to.meta.requiresAdmin === true;
  const isAdmin = authStore.isAdmin;

  if (requiresAuth && !isAuthenticated) {
    next('/login');
    return;
  }
  
  if (isAdmin && to.path === '/dashboard') {
    next('/admin/users');
    return;
  }
  
  if (isAdmin && to.path === '/balance') {
    next();
    return;
  }
  
  if (!isAdmin && requiresAdmin) {
    next('/dashboard');
    return;
  }
  
  if (to.path === '/login' && isAuthenticated) {
    if (isAdmin) {
      next('/admin/users');
    } else {
      next('/dashboard');
    }
    return;
  }
  
  if (to.path === '/' && isAuthenticated) {
    if (isAdmin) {
      next('/admin/users');
    } else {
      next('/dashboard');
    }
    return;
  }
  
  next();
});

export default router;