<template>
  <router-view />
  
  <!-- دکمه نصب PWA - فقط در صفحه لاگین نشون داده میشه -->
  <PWAInstallButton v-if="showInstallButton" />
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/modules/auth/stores/authStore'
import PWAInstallButton from '@/components/ui/PWAInstallButton.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const isReady = ref(false)

// فقط در صفحه لاگین دکمه رو نشون بده
const showInstallButton = computed(() => {
  return isReady.value && route.path === '/login'
})

onMounted(async () => {
  await authStore.checkSession()
  isReady.value = true
  
  if (authStore.isAuthenticated) {
    if (authStore.isAdmin) {
      if (router.currentRoute.value.path === '/' || router.currentRoute.value.path === '/login') {
        router.push('/admin/users')
      }
    } else {
      if (router.currentRoute.value.path === '/' || router.currentRoute.value.path === '/login') {
        router.push('/dashboard')
      }
    }
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  direction: rtl;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Vazirmatn', sans-serif;
  background-color: #f5f7fa;
  color: #1e293b;
}

#app {
  min-height: 100vh;
}
</style>