<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="logo-section">
          <img src="/logo.svg" alt="Logo" class="logo-img" />
          <h1 class="brand-name">آبشده و سکه فکری</h1>
        </div>
        
        <!-- مرحله 1: وارد کردن شماره موبایل -->
        <div v-if="step === 'mobile'" class="step-content">
          <h2 class="auth-title">ورود به سامانه</h2>
          <p class="subtitle">لطفاً شماره موبایل خود را وارد کنید</p>
          
          <form @submit.prevent="sendOtpCode">
            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">📱</span>
                شماره موبایل
              </label>
              <input
                v-model="mobile"
                type="tel"
                placeholder="09123456789"
                class="form-input"
                :class="{ 'error': errorMsg }"
                :disabled="loading"
                autofocus
              />
              <span v-if="errorMsg" class="error-text">
                <span class="error-icon">⚠️</span>
                {{ errorMsg }}
              </span>
            </div>
            
            <button type="submit" :disabled="loading || !isValidMobile" class="btn-primary">
              <span v-if="loading" class="btn-loading">
                <span class="spinner"></span>
                در حال ارسال...
              </span>
              <span v-else class="btn-text">
                <span>📨</span>
                ارسال کد تأیید
              </span>
            </button>
          </form>
          
          <!-- شرایط و قوانین -->
          <div class="terms-section">
            <p class="terms-text">
              با ورود به برنامه،
              <span class="terms-link" @click="openTermsModal">شرایط و قوانین</span>
              را می‌پذیرید
            </p>
          </div>
        </div>
        
        <!-- مرحله 2: وارد کردن کد تأیید -->
        <div v-if="step === 'otp'" class="step-content">
          <h2 class="auth-title">تأیید کد</h2>
          <p class="subtitle">کد تأیید برای شماره {{ formatMobile(mobile) }} ارسال شد</p>
          
          <form @submit.prevent="verifyOtpCode">
            <div class="form-group">
              <label class="form-label">
                <span class="label-icon">🔐</span>
                کد تأیید
              </label>
              <input
                ref="otpInputRef"
                v-model="otp"
                type="text"
                placeholder="123456"
                maxlength="6"
                class="form-input otp-input"
                :class="{ 'error': errorMsg }"
                :disabled="loading"
                @input="handleOtpInput"
              />
              <span v-if="errorMsg" class="error-text">
                <span class="error-icon">⚠️</span>
                {{ errorMsg }}
              </span>
            </div>
            
            <button type="submit" :disabled="loading || !isValidOtp" class="btn-primary">
              <span v-if="loading" class="btn-loading">
                <span class="spinner"></span>
                در حال بررسی...
              </span>
              <span v-else class="btn-text">
                <span>✅</span>
                تأیید و ورود
              </span>
            </button>
            
            <button type="button" @click="resendOtpCode" :disabled="resendDisabled" class="btn-link">
              <span v-if="countdown > 0" class="countdown-text">
                ارسال مجدد کد ({{ countdown }} ثانیه)
              </span>
              <span v-else>ارسال مجدد کد</span>
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- مودال شرایط و قوانین -->
    <Teleport to="body">
      <Transition name="modal-slide">
        <div v-if="isTermsModalOpen" class="modal-overlay" @click.self="closeTermsModal">
          <div class="modal-container terms-modal">
            <div class="modal-header">
              <div class="modal-title">
                <span class="title-icon">📜</span>
                <span class="title-text">شرایط و قوانین</span>
              </div>
              <button @click="closeTermsModal" class="close-modal-btn">✕</button>
            </div>
            
            <div class="modal-body" v-if="loadingTerms">
              <div class="loading-container">
                <div class="spinner-large"></div>
                <p>در حال بارگذاری...</p>
              </div>
            </div>
            
            <div class="modal-body" v-else-if="termsData">
              <div class="terms-content">
                <div class="terms-scroll">
                  <div class="terms-card">
                    <div class="terms-version-info">
                      <span class="version-badge">نسخه {{ termsData.version }}</span>
                      <span class="date-badge">تاریخ انتشار: {{ termsData.created_at }}</span>
                    </div>
                    
                    <div class="terms-text-content" v-html="formattedContent"></div>
                    
                    <div class="terms-footer">
                      <p>آخرین به‌روزرسانی: {{ termsData.created_at }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="modal-body" v-else>
              <div class="error-container">
                <span class="error-icon-large">⚠️</span>
                <p>خطا در بارگذاری شرایط و قوانین</p>
                <button @click="loadTerms" class="btn-retry">تلاش مجدد</button>
              </div>
            </div>
            
            <div class="modal-buttons" v-if="termsData">
              <button @click="closeTermsModal" class="btn-primary accept-btn">
                <span>✓</span>
                متوجه شدم و می‌پذیرم
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { api } from '@/core/http/axios';

const router = useRouter();
const authStore = useAuthStore();

// State
const step = ref<'mobile' | 'otp'>('mobile');
const mobile = ref('');
const otp = ref('');
const loading = ref(false);
const errorMsg = ref('');
const countdown = ref(0);
const isTermsModalOpen = ref(false);
const loadingTerms = ref(false);
const termsData = ref<any>(null);
let countdownInterval: any = null;
const otpInputRef = ref<HTMLInputElement | null>(null);

// Validation
const isValidMobile = computed(() => /^09[0-9]{9}$/.test(mobile.value));
const isValidOtp = computed(() => otp.value.length === 6);

// Computed for formatted content
const formattedContent = computed(() => {
  if (!termsData.value?.content) return '';
  
  let content = termsData.value.content;
  
  // تبدیل لاین بریک‌ها به <br>
  content = content.replace(/\n/g, '<br>');
  
  // تبدیل اعداد انگلیسی به فارسی
  content = content.replace(/[0-9]/g, (d) => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return persianDigits[parseInt(d)];
  });
  
  return content;
});

// Helpers
const formatMobile = (num: string) => {
  if (!num) return '';
  return `${num.slice(0, 4)}****${num.slice(-4)}`;
};

const handleOtpInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  let value = input.value.replace(/[^0-9]/g, '');
  if (value.length > 6) value = value.slice(0, 6);
  otp.value = value;
  
  if (value.length === 6) {
    verifyOtpCode();
  }
};

// Start countdown for resend button
const startCountdown = (seconds: number = 30) => {
  countdown.value = seconds;
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }, 1000);
};

const resendDisabled = computed(() => countdown.value > 0);

// Load terms from API - استفاده از مسیر عمومی
const loadTerms = async () => {
  loadingTerms.value = true;
  try {
    const response = await api.get('/support/terms/public');
    if (response.data.success && response.data.data) {
      termsData.value = response.data.data;
    } else {
      termsData.value = null;
    }
  } catch (err) {
    termsData.value = null;
  } finally {
    loadingTerms.value = false;
  }
};

// Modal functions
const openTermsModal = () => {
  isTermsModalOpen.value = true;
  document.body.style.overflow = 'hidden';
  if (!termsData.value) {
    loadTerms();
  }
};

const closeTermsModal = () => {
  isTermsModalOpen.value = false;
  document.body.style.overflow = '';
};

// Send OTP
const sendOtpCode = async () => {
  if (!isValidMobile.value) {
    errorMsg.value = 'شماره موبایل نامعتبر است';
    return;
  }
  
  loading.value = true;
  errorMsg.value = '';
  
  try {
    await authStore.sendOtp(mobile.value);
    
    sessionStorage.setItem('verify_mobile', mobile.value);
    
    step.value = 'otp';
    errorMsg.value = '';
    
    startCountdown(30);
    
    setTimeout(() => {
      if (otpInputRef.value) {
        otpInputRef.value.focus();
      }
    }, 100);
    
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || 'خطا در ارسال کد تأیید';
  } finally {
    loading.value = false;
  }
};

// Verify OTP
const verifyOtpCode = async () => {
  if (!isValidOtp.value) {
    errorMsg.value = 'کد تأیید باید ۶ رقم باشد';
    return;
  }
  
  loading.value = true;
  errorMsg.value = '';
  
  try {
    const response = await authStore.verifyOtp(mobile.value, otp.value);
    
    if (response.success) {
      sessionStorage.removeItem('verify_mobile');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await authStore.checkSession();
      
      const isAdmin = authStore.isAdmin;
      const isAuth = authStore.isAuthenticated;
      
      if (isAuth) {
        if (isAdmin) {
          router.push('/admin/users');
        } else {
          router.push('/dashboard');
        }
      } else {
        errorMsg.value = 'خطا در ورود، لطفاً مجدداً تلاش کنید';
        step.value = 'mobile';
      }
    } else {
      errorMsg.value = response.error || 'خطا در تأیید کد';
    }
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || 'خطا در تأیید کد';
  } finally {
    loading.value = false;
  }
};

// Resend OTP
const resendOtpCode = async () => {
  if (resendDisabled.value) return;
  
  loading.value = true;
  errorMsg.value = '';
  
  try {
    await authStore.sendOtp(mobile.value);
    errorMsg.value = 'کد جدید با موفقیت ارسال شد';
    
    startCountdown(30);
    
    otp.value = '';
    
    if (otpInputRef.value) {
      otpInputRef.value.focus();
    }
    
    setTimeout(() => {
      if (errorMsg.value === 'کد جدید با موفقیت ارسال شد') {
        errorMsg.value = '';
      }
    }, 3000);
    
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || 'خطا در ارسال مجدد کد';
  } finally {
    loading.value = false;
  }
};

// Check for existing session on mount
onMounted(() => {
  const savedMobile = sessionStorage.getItem('verify_mobile');
  if (savedMobile) {
    mobile.value = savedMobile;
    step.value = 'otp';
    startCountdown(30);
    setTimeout(() => {
      if (otpInputRef.value) {
        otpInputRef.value.focus();
      }
    }, 100);
  }
});

// Cleanup interval on unmount
onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  document.body.style.overflow = '';
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fb 0%, #eef2f6 100%);
  position: relative;
  overflow: hidden;
}

.auth-page::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.auth-container {
  width: 100%;
  max-width: 480px;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.auth-card {
  background: white;
  border-radius: 32px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(102, 126, 234, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.auth-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(102, 126, 234, 0.2);
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-img {
  height: 70px;
  width: auto;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.2));
}

.brand-name {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  letter-spacing: -0.5px;
}

.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.auth-title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  color: #64748b;
  font-size: 14px;
  margin-bottom: 32px;
  font-weight: 500;
}

.form-group {
  margin-bottom: 28px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.label-icon {
  font-size: 16px;
}

.form-input {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: #f8fafc;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.form-input.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.form-input.error:focus {
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.form-input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.otp-input {
  text-align: center;
  letter-spacing: 8px;
  font-size: 24px;
  font-weight: 600;
}

.error-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ef4444;
  font-size: 12px;
  margin-top: 8px;
  font-weight: 500;
}

.error-icon {
  font-size: 12px;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn-primary:hover:not(:disabled)::before {
  left: 100%;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-large {
  width: 40px;
  height: 40px;
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

.btn-link {
  width: 100%;
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 14px;
  padding: 12px;
  margin-top: 12px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-link:hover:not(:disabled) {
  color: #764ba2;
  text-decoration: underline;
}

.btn-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.countdown-text {
  color: #94a3b8;
}

/* شرایط و قوانین */
.terms-section {
  margin-top: 24px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.terms-text {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.terms-link {
  color: #667eea;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.terms-link:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* مودال شرایط و قوانین */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 9999;
}

.modal-container {
  background: white;
  border-radius: 32px 32px 0 0;
  width: 100%;
  max-width: 800px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: all 0.3s ease;
}

.modal-slide-enter-from,
.modal-slide-leave-to {
  opacity: 0;
}

.modal-slide-enter-from .modal-container,
.modal-slide-leave-to .modal-container {
  transform: translateY(100%);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 32px 32px 0 0;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 28px;
}

.title-text {
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.close-modal-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-modal-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.error-icon-large {
  font-size: 48px;
  margin-bottom: 16px;
}

.btn-retry {
  margin-top: 16px;
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.terms-content {
  background: #f8fafc;
  border-radius: 20px;
  padding: 4px;
}

.terms-scroll {
  max-height: 50vh;
  overflow-y: auto;
  padding: 4px;
}

.terms-scroll::-webkit-scrollbar {
  width: 6px;
}

.terms-scroll::-webkit-scrollbar-track {
  background: #e2e8f0;
  border-radius: 10px;
}

.terms-scroll::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 10px;
}

.terms-card {
  padding: 20px;
}

.terms-version-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
}

.version-badge {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.date-badge {
  color: #64748b;
  font-size: 11px;
}

.terms-text-content {
  line-height: 1.8;
  color: #475569;
  font-size: 14px;
}

.terms-text-content h1,
.terms-text-content h2,
.terms-text-content h3,
.terms-text-content h4 {
  color: #1e293b;
  margin: 16px 0 8px 0;
}

.terms-text-content p {
  margin-bottom: 12px;
  text-align: justify;
}

.terms-list {
  margin: 8px 0;
  padding-right: 20px;
}

.terms-list li {
  margin: 6px 0;
  line-height: 1.6;
}

.terms-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.terms-footer p {
  font-size: 11px;
  color: #94a3b8;
}

.modal-buttons {
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
}

.accept-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Responsive */
@media (max-width: 768px) {
  .auth-container {
    padding: 16px;
  }
  
  .auth-card {
    padding: 32px 24px;
  }
  
  .logo-img {
    height: 55px;
  }
  
  .brand-name {
    font-size: 20px;
  }
  
  .auth-title {
    font-size: 24px;
  }
  
  .form-input {
    padding: 12px 16px;
    font-size: 14px;
  }
  
  .otp-input {
    font-size: 20px;
    letter-spacing: 6px;
  }
  
  .btn-primary {
    padding: 12px;
    font-size: 14px;
  }
  
  .modal-container {
    max-height: 90vh;
  }
  
  .modal-header {
    padding: 16px 20px;
  }
  
  .title-text {
    font-size: 18px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .terms-scroll {
    max-height: 40vh;
  }
  
  .terms-version-info {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

/* RTL Support */
.form-input {
  text-align: right;
}

.btn-text span:first-child {
  margin-left: 6px;
}

.otp-input {
  text-align: center;
  letter-spacing: 8px;
  direction: ltr;
}

.terms-text-content {
  text-align: right;
}

.terms-list {
  padding-right: 20px;
  padding-left: 0;
}
</style>