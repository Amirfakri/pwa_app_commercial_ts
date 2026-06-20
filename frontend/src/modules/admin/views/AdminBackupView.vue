<!-- frontend/src/modules/admin/views/AdminBackupView.vue -->
<template>
  <div class="admin-backup-page">
    <div class="page-header">
      <h1>💾 مدیریت بکاپ</h1>
      <p>پشتیبان‌گیری منظم از اطلاعات سیستم</p>
    </div>

    <div class="backup-grid">
      <!-- کارت اکسل روزانه -->
      <div class="backup-card excel-card">
        <div class="card-glow"></div>
        <div class="card-icon-wrapper">
          <span class="card-icon">📊</span>
        </div>
        <h3>گزارش اکسل روزانه</h3>
        <p>دریافت فایل اکسل از تراکنش‌های تأیید شده امروز</p>
        <div class="card-stats">
          <div class="stat">
            <span class="stat-label">تاریخ امروز</span>
            <span class="stat-value">{{ todayDate }}</span>
          </div>
        </div>
        <button @click="downloadLiveExcel" :disabled="downloading" class="btn-excel">
          <svg v-if="!downloading" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3v12m0 0-3-3m3 3 3-3M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/>
          </svg>
          <span v-if="downloading" class="spinner-small"></span>
          {{ downloading ? 'در حال ایجاد...' : 'دانلود اکسل معاملات امروز' }}
        </button>
      </div>

      <!-- کارت بکاپ SQL -->
      <div class="backup-card sql-card">
        <div class="card-glow"></div>
        <div class="card-icon-wrapper">
          <span class="card-icon">🗄️</span>
        </div>
        <h3>بکاپ SQL</h3>
        <p>ایجاد فایل پشتیبان از جداول انتخابی</p>
        
        <div class="date-range">
          <div class="date-input">
            <label>تاریخ شروع</label>
            <div class="date-input-wrapper">
              <span class="date-icon">📅</span>
              <input 
                type="text" 
                v-model="backupForm.start_date_fa" 
                @click="openStartDatePicker"
                readonly
                class="form-input persian-date-input"
                placeholder="انتخاب تاریخ شروع"
              />
            </div>
          </div>
          <div class="date-arrow">➡️</div>
          <div class="date-input">
            <label>تاریخ پایان</label>
            <div class="date-input-wrapper">
              <span class="date-icon">📅</span>
              <input 
                type="text" 
                v-model="backupForm.end_date_fa" 
                @click="openEndDatePicker"
                readonly
                class="form-input persian-date-input"
                placeholder="انتخاب تاریخ پایان"
              />
            </div>
          </div>
        </div>

        <div class="tables-section">
          <label>انتخاب جداول</label>
          <div class="tables-grid">
            <label v-for="table in availableTables" :key="table.value" class="table-checkbox" :class="{ checked: backupForm.tables.includes(table.value) }">
              <input type="checkbox" :value="table.value" v-model="backupForm.tables" />
              <span class="checkbox-custom">
                <svg v-if="backupForm.tables.includes(table.value)" class="check-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </span>
              <span class="table-name">
                <span class="table-icon">{{ table.icon }}</span>
                {{ table.name }}
              </span>
            </label>
          </div>
        </div>

        <button @click="generateSqlBackup" :disabled="generating || !isSqlFormValid" class="btn-backup">
          <svg v-if="!generating" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
          <span v-if="generating" class="spinner-small"></span>
          {{ generating ? 'در حال ایجاد...' : 'ایجاد بکاپ SQL' }}
        </button>
      </div>

      <!-- کارت پاکسازی -->
      <div class="backup-card cleanup-card">
        <div class="card-glow"></div>
        <div class="card-icon-wrapper">
          <span class="card-icon">🧹</span>
        </div>
        <h3>پاکسازی بکاپ‌های قدیمی</h3>
        <p>حذف خودکار فایل‌های پشتیبان قدیمی</p>
        
        <div class="cleanup-input">
          <label>تعداد روز</label>
          <div class="number-input">
            <button @click="decreaseDays" class="num-btn">-</button>
            <input type="number" v-model.number="cleanupDays" min="1" max="365" class="num-input" />
            <button @click="increaseDays" class="num-btn">+</button>
          </div>
          <small>بکاپ‌های قدیمی‌تر از این تعداد روز حذف می‌شوند</small>
        </div>

        <button @click="cleanupBackups" :disabled="cleaning" class="btn-cleanup">
          <svg v-if="!cleaning" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>
          </svg>
          <span v-if="cleaning" class="spinner-small"></span>
          {{ cleaning ? 'در حال پاکسازی...' : 'پاکسازی بکاپ‌های قدیمی' }}
        </button>
      </div>
    </div>

    <!-- تاریخچه بکاپ‌ها -->
    <div class="history-section">
      <div class="section-header">
        <div class="header-left">
          <span class="header-icon">📜</span>
          <h2>تاریخچه بکاپ‌ها</h2>
        </div>
        <div class="stats-badge" v-if="!loadingHistory && history.length > 0">
          <span class="stats-count">{{ toPersianNumber(history.length) }}</span>
          <span class="stats-label">بکاپ</span>
        </div>
      </div>

      <div class="history-content">
        <div v-if="loadingHistory" class="loading-container">
          <div class="loading-spinner"></div>
          <p>در حال بارگذاری تاریخچه...</p>
        </div>

        <div v-else-if="history.length === 0" class="empty-state">
          <div class="empty-animation">📭</div>
          <p>هیچ بکاپی یافت نشد</p>
          <span>با استفاده از بخش بکاپ SQL اولین پشتیبان را ایجاد کنید</span>
        </div>

        <div v-else class="history-timeline">
          <div v-for="(item, index) in history" :key="item.id" class="timeline-item">
            <div class="timeline-marker" :class="{ 'is-latest': index === 0 }">
              <div class="marker-dot"></div>
              <div v-if="index < history.length - 1" class="marker-line"></div>
            </div>
            <div class="timeline-card">
              <div class="card-header">
                <div class="file-info">
                  <div class="file-icon">🗄️</div>
                  <div>
                    <div class="file-name">{{ item.file_name }}</div>
                    <div class="file-meta">{{ toPersianNumber(item.record_count) }} رکورد</div>
                  </div>
                </div>
                <div class="date-info">
                  <div class="persian-date">{{ getPersianDateOnly(item.created_at) }}</div>
                  <div class="persian-time">{{ getPersianTimeOnly(item.created_at) }}</div>
                </div>
              </div>
              <div class="card-footer">
                <div class="admin-info">
                  <span class="admin-icon">👤</span>
                  <span>{{ item.admin_name }}</span>
                </div>
                <div class="tables-list">
                  <span v-for="table in item.tables" :key="table" class="table-tag">
                    {{ getTableShortName(table) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- صفحه‌بندی -->
        <div v-if="pagination.pages > 1" class="pagination-wrapper">
          <div class="pagination">
            <button @click="loadHistory(currentPage - 1)" :disabled="currentPage === 1" class="page-btn prev">
              <span>→</span> قبلی
            </button>
            <div class="page-numbers">
              <button 
                v-for="page in visiblePages" 
                :key="page"
                @click="loadHistory(page)"
                :class="['page-number', { active: page === currentPage }]"
              >
                {{ typeof page === 'number' ? toPersianNumber(page) : page }}
              </button>
            </div>
            <button @click="loadHistory(currentPage + 1)" :disabled="currentPage === pagination.pages" class="page-btn next">
              بعدی <span>←</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- مودال انتخاب تاریخ شمسی -->
    <div v-if="showDatePicker" class="datepicker-modal-overlay" @click.self="closeDatePicker">
      <div class="datepicker-modal">
        <div class="datepicker-header">
          <h3>{{ datePickerType === 'start' ? 'انتخاب تاریخ شروع' : 'انتخاب تاریخ پایان' }}</h3>
          <button @click="closeDatePicker" class="close-datepicker">✕</button>
        </div>
        <Vue3PersianDateTimePicker 
          v-model="tempDate"
          :config="dateTimeConfig"
          @update:modelValue="onDateSelect"
        />
        <div class="datepicker-actions">
          <button @click="confirmDate" class="confirm-date-btn">تأیید</button>
          <button @click="closeDatePicker" class="cancel-date-btn">انصراف</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '@/core/http/axios';
import moment from 'moment-jalaali';
import Vue3PersianDateTimePicker from 'vue3-persian-datetime-picker';

moment.loadPersian({ dialect: 'persian-modern' });

interface BackupHistory {
  id: number;
  admin_id: number;
  admin_name: string;
  tables: string[];
  record_count: number;
  file_name: string;
  created_at: string;
}

const availableTables = [
  { value: 'users', name: 'کاربران', icon: '👥' },
  { value: 'transactions', name: 'تراکنش‌ها', icon: '💳' },
  { value: 'remittances', name: 'حواله‌ها', icon: '📦' },
  { value: 'riz_accounts', name: 'حساب‌های ریز', icon: '📊' },
  { value: 'riz_transactions', name: 'تراکنش‌های ریز', icon: '🔄' },
  { value: 'notifications', name: 'اعلان‌ها', icon: '🔔' },
  { value: 'price_history', name: 'تاریخچه قیمت', icon: '📈' },
  { value: 'offset_settings', name: 'تنظیمات افست', icon: '⚙️' }
];

const dateTimeConfig = {
  time: false,
  hour24: true,
  format: 'jYYYY-jMM-jDD',
  placeholder: 'انتخاب تاریخ',
  locale: 'fa',
  autoSubmit: false,
  showTime: false,
  showTodayButton: true,
  closeOnSelect: false,
  formatDisplay: 'jYYYY-jMM-jDD',
  displayFormat: 'jYYYY-jMM-jDD'
};

const getTableShortName = (table: string): string => {
  const names: Record<string, string> = {
    users: '👥 کاربران',
    transactions: '💳 تراکنش‌ها',
    remittances: '📦 حواله‌ها',
    riz_accounts: '📊 حساب ریز',
    riz_transactions: '🔄 تراکنش ریز',
    notifications: '🔔 اعلان‌ها',
    price_history: '📈 قیمت‌ها',
    offset_settings: '⚙️ افست'
  };
  return names[table] || table;
};

const toPersianNumber = (num: number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, d => persianDigits[parseInt(d)]);
};

const convertToGregorian = (persianDate: string): string => {
  if (!persianDate) return '';
  const parts = persianDate.split('-');
  if (parts.length !== 3) return '';
  const gregorian = moment(`${parts[0]}-${parts[1]}-${parts[2]}`, 'jYYYY-jMM-jDD').format('YYYY-MM-DD');
  return gregorian;
};

const getPersianDateOnly = (date: string): string => {
  if (!date) return '-';
  return moment(date).format('jD jMMMM jYYYY');
};

const getPersianTimeOnly = (date: string): string => {
  if (!date) return '-';
  return moment(date).format('HH:mm:ss');
};

const todayDate = computed(() => {
  return moment().format('jD jMMMM jYYYY');
});

const downloading = ref(false);
const generating = ref(false);
const cleaning = ref(false);
const loadingHistory = ref(false);
const history = ref<BackupHistory[]>([]);
const currentPage = ref(1);
const pagination = ref({ page: 1, limit: 10, total: 0, pages: 0 });
const cleanupDays = ref(30);
const showDatePicker = ref(false);
const datePickerType = ref<'start' | 'end'>('start');
const tempDate = ref('');

const backupForm = ref({
  start_date: '',
  end_date: '',
  start_date_fa: '',
  end_date_fa: '',
  tables: ['users', 'transactions']
});

const visiblePages = computed(() => {
  const total = pagination.value.pages;
  const current = currentPage.value;
  const delta = 2;
  const range = [];
  const rangeWithDots = [];
  
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }
  
  if (current - delta > 2) {
    rangeWithDots.push(1, '...');
  } else {
    rangeWithDots.push(1);
  }
  
  rangeWithDots.push(...range);
  
  if (current + delta < total - 1) {
    rangeWithDots.push('...', total);
  } else if (total !== 1 && total !== undefined) {
    if (rangeWithDots[rangeWithDots.length - 1] !== total) {
      rangeWithDots.push(total);
    }
  }
  
  return rangeWithDots;
});

const isSqlFormValid = computed(() => {
  return backupForm.value.start_date && 
         backupForm.value.end_date && 
         backupForm.value.tables.length > 0;
});

const openStartDatePicker = () => {
  datePickerType.value = 'start';
  tempDate.value = backupForm.value.start_date_fa || moment().format('jYYYY-jMM-jDD');
  showDatePicker.value = true;
};

const openEndDatePicker = () => {
  datePickerType.value = 'end';
  tempDate.value = backupForm.value.end_date_fa || moment().format('jYYYY-jMM-jDD');
  showDatePicker.value = true;
};

const onDateSelect = (value: string) => {
  tempDate.value = value;
};

const confirmDate = () => {
  if (datePickerType.value === 'start') {
    backupForm.value.start_date_fa = tempDate.value;
    backupForm.value.start_date = convertToGregorian(tempDate.value);
  } else {
    backupForm.value.end_date_fa = tempDate.value;
    backupForm.value.end_date = convertToGregorian(tempDate.value);
  }
  closeDatePicker();
};

const closeDatePicker = () => {
  showDatePicker.value = false;
  tempDate.value = '';
};

const decreaseDays = () => {
  if (cleanupDays.value > 1) cleanupDays.value--;
};

const increaseDays = () => {
  if (cleanupDays.value < 365) cleanupDays.value++;
};

const downloadLiveExcel = async () => {
  downloading.value = true;
  try {
    const response = await api.get('/backup/live-excel', {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'transactions.xlsx';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) fileName = match[1];
    }
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    alert('خطا در دریافت فایل اکسل');
  } finally {
    downloading.value = false;
  }
};

const generateSqlBackup = async () => {
  if (!isSqlFormValid.value) return;
  
  generating.value = true;
  try {
    const payload = {
      start_date: backupForm.value.start_date,
      end_date: backupForm.value.end_date,
      tables: backupForm.value.tables
    };
    const response = await api.post('/backup/full', payload, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'backup.sql';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) fileName = match[1];
    }
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    await loadHistory(currentPage.value);
  } catch (err: any) {
    alert('خطا در ایجاد بکاپ');
  } finally {
    generating.value = false;
  }
};

const cleanupBackups = async () => {
  cleaning.value = true;
  try {
    const response = await api.post('/backup/cleanup', { days: cleanupDays.value });
    if (response.data.success) {
      alert(`✅ ${response.data.deleted_count} بکاپ قدیمی پاک شد`);
      await loadHistory(currentPage.value);
    }
  } catch (err: any) {
    alert('خطا در پاکسازی بکاپ‌ها');
  } finally {
    cleaning.value = false;
  }
};

const loadHistory = async (page: number = 1) => {
  loadingHistory.value = true;
  currentPage.value = page;
  try {
    const response = await api.get(`/backup/history?page=${page}&limit=10`);
    if (response.data.success) {
      history.value = response.data.data;
      pagination.value = response.data.pagination;
    }
  } catch (err: any) {
    console.error('Error loading backup history:', err);
  } finally {
    loadingHistory.value = false;
  }
};

onMounted(() => {
  // تنظیم تاریخ پیش‌فرض امروز به شمسی
  const today = moment().format('jYYYY-jMM-jDD');
  backupForm.value.start_date_fa = today;
  backupForm.value.end_date_fa = today;
  backupForm.value.start_date = convertToGregorian(today);
  backupForm.value.end_date = convertToGregorian(today);
  
  loadHistory();
});
</script>

<style scoped>
.admin-backup-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4f8 0%, #e8ecf1 100%);
  padding: 32px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.page-header p {
  color: #64748b;
  font-size: 14px;
}

.backup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.backup-card {
  position: relative;
  background: white;
  border-radius: 24px;
  padding: 28px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.backup-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.excel-card .card-glow {
  background: linear-gradient(90deg, #27ae60, #2ecc71, #27ae60);
}

.sql-card .card-glow {
  background: linear-gradient(90deg, #3498db, #2980b9, #3498db);
}

.cleanup-card .card-glow {
  background: linear-gradient(90deg, #e67e22, #d35400, #e67e22);
}

.card-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.card-icon {
  font-size: 32px;
}

.backup-card h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.backup-card p {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 20px;
}

.card-stats {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.date-input {
  flex: 1;
}

.date-input label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 6px;
}

.date-input-wrapper {
  position: relative;
}

.date-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}

.persian-date-input {
  width: 100%;
  padding: 10px 36px 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 13px;
  text-align: right;
  background: white;
  cursor: pointer;
}

.persian-date-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.date-arrow {
  font-size: 20px;
  color: #94a3b8;
  margin-top: 20px;
}

.tables-section {
  margin-bottom: 24px;
}

.tables-section label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 12px;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.table-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 10px;
  transition: all 0.2s;
}

.table-checkbox:hover {
  background: #e8edf2;
}

.table-checkbox.checked {
  background: #e8edf2;
}

.table-checkbox input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: white;
}

.table-checkbox.checked .checkbox-custom {
  background: #667eea;
  border-color: #667eea;
}

.check-icon {
  width: 14px;
  height: 14px;
  color: white;
}

.table-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #334155;
}

.table-icon {
  font-size: 14px;
}

.btn-excel, .btn-backup, .btn-cleanup {
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
}

.btn-excel {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
}

.btn-excel:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
}

.btn-backup {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.btn-backup:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.btn-cleanup {
  background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
}

.btn-cleanup:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(230, 126, 34, 0.3);
}

.btn-excel:disabled, .btn-backup:disabled, .btn-cleanup:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.cleanup-input {
  margin-bottom: 24px;
}

.cleanup-input label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 8px;
}

.number-input {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.num-btn {
  width: 36px;
  height: 36px;
  background: #f1f5f9;
  border: none;
  border-radius: 10px;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.num-btn:hover {
  background: #e2e8f0;
}

.num-input {
  width: 80px;
  text-align: center;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
}

.cleanup-input small {
  font-size: 11px;
  color: #94a3b8;
}

.history-section {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 24px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.stats-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 30px;
}

.stats-count {
  font-size: 18px;
  font-weight: 700;
}

.stats-label {
  font-size: 12px;
}

.history-content {
  padding: 24px 28px;
}

.history-timeline {
  position: relative;
}

.timeline-item {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
}

.timeline-marker {
  position: relative;
  width: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marker-dot {
  width: 12px;
  height: 12px;
  background: #667eea;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 0 2px #667eea;
  z-index: 2;
}

.timeline-marker.is-latest .marker-dot {
  width: 14px;
  height: 14px;
  background: #27ae60;
  box-shadow: 0 0 0 2px #27ae60;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 2px #27ae60; }
  50% { box-shadow: 0 0 0 6px rgba(39, 174, 96, 0.2); }
}

.marker-line {
  flex: 1;
  width: 2px;
  background: linear-gradient(to bottom, #e2e8f0, transparent);
  margin-top: 4px;
}

.timeline-card {
  flex: 1;
  background: #f8f9fa;
  border-radius: 16px;
  padding: 16px 20px;
  transition: all 0.2s;
}

.timeline-card:hover {
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 28px;
}

.file-name {
  font-weight: 600;
  color: #1a1a2e;
  font-size: 14px;
  direction: ltr;
}

.file-meta {
  font-size: 11px;
  color: #64748b;
}

.date-info {
  text-align: left;
}

.persian-date {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}

.persian-time {
  font-size: 11px;
  color: #94a3b8;
  direction: ltr;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.tables-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.table-tag {
  background: #e8edf2;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  color: #475569;
}

.loading-container {
  text-align: center;
  padding: 60px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px;
}

.empty-animation {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.empty-state span {
  font-size: 13px;
  color: #94a3b8;
}

.pagination-wrapper {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 6px;
}

.page-number {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  transition: all 0.2s;
}

.page-number:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.page-number.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

/* مودال انتخاب تاریخ شمسی */
.datepicker-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.datepicker-modal {
  background: white;
  border-radius: 24px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.datepicker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.datepicker-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-datepicker {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  color: white;
}

.datepicker-actions {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
}

.confirm-date-btn {
  flex: 1;
  padding: 10px;
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.cancel-date-btn {
  flex: 1;
  padding: 10px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .admin-backup-page {
    padding: 16px;
  }
  
  .backup-grid {
    grid-template-columns: 1fr;
  }
  
  .date-range {
    flex-direction: column;
  }
  
  .date-arrow {
    transform: rotate(90deg);
    margin: 0;
  }
  
  .tables-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .date-info {
    text-align: right;
  }
  
  .card-footer {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .history-content {
    padding: 16px;
  }
  
  .pagination {
    gap: 6px;
  }
  
  .page-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .page-number {
    min-width: 32px;
    height: 32px;
    font-size: 12px;
  }
}
</style>