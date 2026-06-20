<template>
  <div v-if="showButton" class="pwa-install-wrapper">
    <button @click="handleInstall" class="pwa-install-btn">
      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span>📲 نصب برنامه</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showButton = ref(false)
let deferredPrompt: any = null

const handleInstall = async () => {
  if (!deferredPrompt) {
    // اگر رویداد ذخیره نشده، راهنما نشان بده
    showManualGuide()
    return
  }
  
  // نمایش دیالوگ نصب مرورگر
  deferredPrompt.prompt()
  
  // منتظر انتخاب کاربر
  const { outcome } = await deferredPrompt.userChoice
  
  if (outcome === 'accepted') {
    console.log('✅ کاربر نصب را پذیرفت')
    showButton.value = false
  } else {
    console.log('❌ کاربر نصب را رد کرد')
  }
  
  deferredPrompt = null
}

const showManualGuide = () => {
  const guide = document.createElement('div')
  guide.className = 'pwa-manual-guide'
  guide.innerHTML = `
    <div class="guide-card">
      <button class="close-guide">✕</button>
      <h3>📱 نصب برنامه در این دستگاه</h3>
      <div class="steps">
        <div class="step">1. روی سه نقطه <strong>⋮</strong> در مرورگر کلیک کنید</div>
        <div class="step">2. گزینه <strong>Install App</strong> را انتخاب کنید</div>
        <div class="step">3. روی <strong>Install</strong> کلیک کنید</div>
      </div>
      <button class="close-button">باشه، فهمیدم</button>
    </div>
  `
  document.body.appendChild(guide)
  
  const close = () => guide.remove()
  guide.querySelector('.close-guide')?.addEventListener('click', close)
  guide.querySelector('.close-button')?.addEventListener('click', close)
  guide.addEventListener('click', (e) => {
    if (e.target === guide) close()
  })
}

onMounted(() => {
  // بررسی اینکه آیا قبلاً نصب شده
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  
  if (isStandalone) {
    showButton.value = false
    return
  }
  
  // گوش دادن به رویداد beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('🎯 رویداد beforeinstallprompt دریافت شد')
    e.preventDefault()
    deferredPrompt = e
    showButton.value = true
  })
  
  // اگر رویداد نیامد، بعد از 5 ثانیه راهنما نشان بده
  setTimeout(() => {
    if (!showButton.value && !isStandalone) {
      showManualGuide()
    }
  }, 5000)
})
</script>

<style scoped>
.pwa-install-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

.pwa-install-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #42b883 0%, #2c8c5f 100%);
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(66, 184, 131, 0.3);
}

.pwa-install-btn:active {
  transform: scale(0.98);
}

.icon {
  width: 20px;
  height: 20px;
}

/* استایل راهنما */
:deep(.pwa-manual-guide) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.guide-card) {
  background: white;
  border-radius: 24px;
  max-width: 320px;
  width: 85%;
  padding: 24px;
  text-align: center;
  position: relative;
}

:deep(.close-guide) {
  position: absolute;
  top: 12px;
  left: 12px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

:deep(.steps) {
  text-align: right;
  margin: 20px 0;
}

:deep(.step) {
  margin-bottom: 16px;
  font-size: 14px;
}

:deep(.close-button) {
  background: #42b883;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 10px 20px;
  margin-top: 16px;
  cursor: pointer;
  width: 100%;
}
</style>