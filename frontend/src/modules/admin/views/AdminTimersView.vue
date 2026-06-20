<template>
  <div class="admin-timer-page">
    <h1>⏱️ مدیریت تایمر تراکنش</h1>
    
    <div class="timer-card">
      <div class="card-header">
        <span class="card-icon">⏲️</span>
        <h2>تنظیم تایمر انقضای تراکنش</h2>
      </div>
      
      <div class="timer-body">
        <div class="current-timer">
          <div class="timer-display">
            <span class="timer-value">{{ displayTimerValue }}</span>
            <span class="timer-unit">ثانیه</span>
          </div>
          <div class="timer-info">
            آخرین بروزرسانی: {{ formatDateTime(lastUpdateTime) }}
          </div>
        </div>
        
        <div class="timer-control">
          <label>مقدار جدید تایمر (۵ تا ۳۰۰ ثانیه)</label>
          <div class="input-group">
            <input 
              type="range" 
              v-model="newTimerValue" 
              min="5" 
              max="300" 
              step="5"
              class="timer-slider"
            />
            <input 
              type="number" 
              v-model.number="newTimerValue" 
              min="5" 
              max="300" 
              step="5"
              class="timer-number"
            />
            <span class="unit">ثانیه</span>
          </div>
          <div class="timer-presets">
            <button 
              v-for="preset in presets" 
              :key="preset" 
              @click="newTimerValue = preset"
              class="preset-btn"
            >
              {{ preset }} ثانیه
            </button>
          </div>
        </div>
        
        <div class="timer-actions">
          <button @click="updateTimer" :disabled="updating || !isValid" class="btn-primary">
            {{ updating ? 'در حال ذخیره...' : 'ذخیره تغییرات' }}
          </button>
          <button @click="resetToDefault" class="btn-secondary">
            بازنشانی به پیش‌فرض (۳۰ ثانیه)
          </button>
        </div>
        
        <div v-if="updateMessage" :class="['update-message', updateType]" class="update-message">
          {{ updateMessage }}
        </div>
      </div>
    </div>
    
    <div class="info-card">
      <h3>📌 نکات مهم</h3>
      <ul>
        <li>تایمر برای هر تراکنش جدید اعمال می‌شود</li>
        <li>تراکنش‌های در حال انتظار پس از اتمام تایمر به‌طور خودکار منقضی می‌شوند</li>
        <li>حداقل مقدار مجاز: ۵ ثانیه</li>
        <li>حداکثر مقدار مجاز: ۳۰۰ ثانیه (۵ دقیقه)</li>
        <li>تغییر تایمر روی تراکنش‌های در حال انجام تأثیری ندارد</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '@/core/http/axios';

const currentTimerValue = ref(30);
const newTimerValue = ref(30);
const lastUpdateTime = ref('');
const updating = ref(false);
const updateMessage = ref('');
const updateType = ref('success');

const presets = [10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300];

// مقدار نمایشی تایمر - جلوگیری از NaN
const displayTimerValue = computed(() => {
  const val = currentTimerValue.value;
  return isNaN(val) || val === null ? 30 : val;
});

const isValid = computed(() => {
  const val = newTimerValue.value;
  return !isNaN(val) && val >= 5 && val <= 300;
});

const formatDateTime = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fa-IR') + ' ' + d.toLocaleTimeString('fa-IR');
};

const loadTimer = async () => {
  try {
    const response = await api.get('/admin/timer');
    if (response.data.success && response.data.data) {
      const value = parseInt(response.data.data.value);
      // بررسی اینکه مقدار valid است یا خیر
      currentTimerValue.value = !isNaN(value) && value >= 5 && value <= 300 ? value : 30;
      newTimerValue.value = !isNaN(value) && value >= 5 && value <= 300 ? value : 30;
      lastUpdateTime.value = response.data.data.updated_at || '';
    } else {
      // مقدار پیش‌فرض در صورت عدم وجود داده
      currentTimerValue.value = 30;
      newTimerValue.value = 30;
    }
  } catch (err) {
    console.error('Error loading timer:', err);
    // مقدار پیش‌فرض در صورت خطا
    currentTimerValue.value = 30;
    newTimerValue.value = 30;
  }
};

const updateTimer = async () => {
  if (!isValid.value) return;
  
  updating.value = true;
  updateMessage.value = '';
  
  try {
    const response = await api.put('/admin/timer', { value: newTimerValue.value });
    if (response.data.success) {
      currentTimerValue.value = newTimerValue.value;
      updateMessage.value = response.data.message || 'تایمر با موفقیت به‌روزرسانی شد';
      updateType.value = 'success';
      lastUpdateTime.value = new Date().toISOString();
      
      setTimeout(() => {
        updateMessage.value = '';
      }, 3000);
    }
  } catch (err: any) {
    console.error('Error updating timer:', err);
    updateMessage.value = err.response?.data?.error || 'خطا در به‌روزرسانی تایمر';
    updateType.value = 'error';
    
    setTimeout(() => {
      updateMessage.value = '';
    }, 3000);
  } finally {
    updating.value = false;
  }
};

const resetToDefault = () => {
  newTimerValue.value = 30;
};

onMounted(() => {
  loadTimer();
});
</script>

<style scoped>
.admin-timer-page {
  padding: 24px;
  background: #f5f6fa;
  min-height: 100vh;
}

.admin-timer-page h1 {
  margin-bottom: 24px;
  color: #1a1a2e;
}

.timer-card, .info-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #667eea;
}

.card-icon {
  font-size: 28px;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.current-timer {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  margin-bottom: 24px;
  color: white;
}

.timer-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.timer-value {
  font-size: 64px;
  font-weight: bold;
}

.timer-unit {
  font-size: 20px;
}

.timer-info {
  font-size: 13px;
  opacity: 0.8;
}

.timer-control {
  margin-bottom: 24px;
}

.timer-control label {
  display: block;
  margin-bottom: 12px;
  font-weight: 500;
  color: #555;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.timer-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
}

.timer-number {
  width: 80px;
  padding: 8px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.unit {
  color: #666;
}

.timer-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.preset-btn {
  background: #f0f0f0;
  border: none;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #667eea;
  color: white;
}

.timer-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.btn-primary {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
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
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

.btn-secondary:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
}

.update-message {
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
}

.update-message.success {
  background: #e8f5e9;
  color: #27ae60;
}

.update-message.error {
  background: #ffebee;
  color: #e74c3c;
}

.info-card h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #333;
}

.info-card ul {
  margin: 0;
  padding-right: 20px;
}

.info-card li {
  margin-bottom: 8px;
  color: #666;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .admin-timer-page {
    padding: 16px;
  }
  
  .timer-actions {
    flex-direction: column;
  }
  
  .timer-presets {
    justify-content: center;
  }
}
</style>