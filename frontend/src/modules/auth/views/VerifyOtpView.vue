
<template>
  <div class="verify-page">
    <div class="verify-card">
      <h1>تأیید کد</h1>
      <p class="subtitle">کد تأیید برای شماره {{ mobile }} ارسال شد</p>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>کد تأیید</label>
          <input
            v-model="otp"
            type="text"
            placeholder="123456"
            maxlength="6"
            class="form-input"
            :class="{ 'error': errorMsg }"
          />
          <span v-if="errorMsg" class="error-text">{{ errorMsg }}</span>
        </div>
        
        <button type="submit" :disabled="loading || !otp" class="btn-primary">
          {{ loading ? 'در حال بررسی...' : 'تأیید و ورود' }}
        </button>
        
        <button type="button" @click="resendOtp" class="btn-link">
          ارسال مجدد کد
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const mobile = ref('');
const otp = ref('');
const loading = ref(false);
const errorMsg = ref('');

onMounted(() => {
  const savedMobile = sessionStorage.getItem('verify_mobile');
  if (savedMobile) {
    mobile.value = savedMobile;
  } else {
    router.push('/login');
  }
});

async function handleSubmit() {
  if (!otp.value || otp.value.length !== 6) {
    errorMsg.value = 'کد تأیید باید ۶ رقم باشد';
    return;
  }
  
  loading.value = true;
  errorMsg.value = '';
  
  try {
    const response = await authStore.verifyOtp(mobile.value, otp.value);
    console.log('Login response:', response);
    
    if (response.success) {
      sessionStorage.removeItem('verify_mobile');
      
      // مهم: منتظر بمانید تا store بروز شود
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // دوباره session را چک کنید
      await authStore.checkSession();
      
      const isAdmin = authStore.isAdmin;
      const isAuth = authStore.isAuthenticated;
      
      console.log('After login - isAuth:', isAuth, 'isAdmin:', isAdmin);
      
      if (isAuth) {
        if (isAdmin) {
          router.push('/admin/users');
        } else {
          router.push('/dashboard');
        }
      } else {
        console.error('Authentication failed after OTP');
        router.push('/login');
      }
    }
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || 'خطا در تأیید کد';
  } finally {
    loading.value = false;
  }
}

async function resendOtp() {
  loading.value = true;
  errorMsg.value = '';
  
  try {
    await authStore.sendOtp(mobile.value);
    errorMsg.value = 'کد جدید با موفقیت ارسال شد';
    setTimeout(() => { errorMsg.value = ''; }, 3000);
  } catch (err: any) {
    errorMsg.value = err.response?.data?.error || 'خطا در ارسال مجدد کد';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.verify-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.verify-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  margin-bottom: 8px;
  color: #333;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 24px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  text-align: center;
  letter-spacing: 4px;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input.error {
  border-color: #e74c3c;
}

.error-text {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 4px;
  display: block;
  text-align: center;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 16px;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-link {
  width: 100%;
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 14px;
}

.btn-link:hover {
  text-decoration: underline;
}
</style>
