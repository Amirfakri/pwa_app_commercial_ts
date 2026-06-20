<template>
  <div class="admin-transactions-page">
    <h1>مدیریت تراکنش‌ها</h1>

    <!-- فیلترها -->
    <div class="filters-card">
      <div class="filters-row">
        <div class="filter-group">
          <label>وضعیت</label>
          <select v-model="filters.status" @change="loadTransactions">
            <option value="">همه</option>
            <option value="pending">در انتظار</option>
            <option value="approved">تأیید شده</option>
            <option value="rejected">رد شده</option>
            <option value="expired">منقضی شده</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>از تاریخ (شمسی)</label>
          <Vue3PersianDateTimePicker 
            v-model="tempStartDate"
            :config="dateTimeConfig"
            placeholder="انتخاب تاریخ شروع"
          />
        </div>
        
        <div class="filter-group">
          <label>تا تاریخ (شمسی)</label>
          <Vue3PersianDateTimePicker 
            v-model="tempEndDate"
            :config="dateTimeConfig"
            placeholder="انتخاب تاریخ پایان"
          />
        </div>
        
        <div class="filter-group">
          <label>کاربر</label>
          <input type="text" v-model="userSearch" placeholder="جستجوی کاربر..." @input="searchUsers" />
          <select v-if="users.length" v-model="filters.user_id" @change="loadTransactions" class="user-select">
            <option value="">انتخاب کاربر...</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.full_name || user.mobile_number }} ({{ user.code }})
            </option>
          </select>
        </div>
        
        <button @click="applyDateFilter" class="btn-search">🔍 جستجو</button>
        <button @click="resetFilters" class="btn-reset">🔄 ریست</button>
        <button @click="loadTodayTransactions" class="btn-today">📅 امروز</button>
      </div>
    </div>

    <!-- آمار -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-label">تعداد کل</span>
        <span class="stat-value">{{ toPersianNumber(transactions.length) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">در انتظار</span>
        <span class="stat-value pending-stats">{{ toPersianNumber(pendingCount) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">تأیید شده</span>
        <span class="stat-value approved-stats">{{ toPersianNumber(approvedCount) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">رد شده</span>
        <span class="stat-value rejected-stats">{{ toPersianNumber(rejectedCount) }}</span>
      </div>
    </div>

    <!-- نمایش بازه زمانی فعال -->
    <div v-if="activeDateRange" class="active-filter-badge">
      <span>📅 بازه انتخاب شده:</span>
      <strong>{{ activeDateRange }}</strong>
      <button @click="clearDateFilter" class="clear-filter-btn">✕</button>
    </div>

    <!-- لودینگ -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>در حال بارگذاری تراکنش‌ها...</p>
    </div>

    <!-- جدول تراکنش‌ها -->
    <div v-else class="table-container">
      <table dir="rtl">
        <thead>
          <tr>
            <th>کد</th>
            <th>کاربر</th>
            <th>محصول</th>
            <th>نوع</th>
            <th>مقدار</th>
            <th>مبلغ (ریال)</th>
            <th>قیمت واحد (ریال)</th>
            <th>وضعیت</th>
            <th>تاریخ و ساعت</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in transactions" :key="tx.id" :class="{ editing: editingId === tx.id }">
            <td class="tx-id">{{ tx.id }}</td>
            <td>
              <div class="user-info-cell">
                <span class="user-name">{{ tx.user_info?.full_name || '-' }}</span>
                <span class="user-mobile">{{ tx.user_info?.mobile_number }}</span>
                <span class="user-code">{{ tx.user_info?.code }}</span>
              </div>
            </td>
            <td class="product-cell">
              <select v-if="editingId === tx.id" v-model="editData.product_code" @change="onProductChange" class="edit-select product-select">
                <option value="">انتخاب محصول...</option>
                <optgroup label="محصولات آبشده">
                  <option v-for="product in meltedProducts" :key="product.code" :value="product.code">
                    {{ product.display_name || product.name }} ({{ product.code }})
                  </option>
                </optgroup>
                <optgroup label="سکه‌ها">
                  <option v-for="product in coinProducts" :key="product.code" :value="product.code">
                    {{ product.display_name || product.name }} ({{ product.code }})
                  </option>
                </optgroup>
              </select>
              <span v-else>
                <span class="product-name">{{ tx.display_name || tx.product_code }}</span>
                <span class="product-code-small">{{ tx.product_code }}</span>
              </span>
            </td>
            <td class="type-cell">
              <select v-if="editingId === tx.id" v-model="editData.type" class="edit-select">
                <option value="خرید">خرید</option>
                <option value="فروش">فروش</option>
              </select>
              <span v-else :class="tx.type === 'خرید' ? 'type-buy' : 'type-sell'">
                {{ tx.type === 'خرید' ? 'خرید' : 'فروش' }}
              </span>
            </td>
            <td class="quantity-cell">
              <div v-if="editingId === tx.id">
                <input 
                  v-if="editData.product_code?.startsWith('AB_')" 
                  type="number" 
                  step="0.001"
                  v-model.number="editData.quantity"
                  class="edit-input"
                  placeholder="وزن (گرم)"
                />
                <input 
                  v-else-if="editData.product_code?.startsWith('COIN_')"
                  type="number" 
                  step="1"
                  v-model.number="editData.quantity"
                  class="edit-input"
                  placeholder="تعداد"
                />
                <input 
                  v-else
                  type="number" 
                  step="0.001"
                  v-model.number="editData.quantity"
                  class="edit-input"
                  placeholder="مقدار"
                />
              </div>
              <div v-else>
                <span v-if="tx.product_code?.startsWith('AB_')" class="large-number">
                  {{ formatWeight(tx.melted_weight) }}
                </span>
                <span v-else class="large-number">
                  {{ formatCoinCount(tx.coin_quantity) }}
                </span>
                <span class="unit">{{ tx.product_code?.startsWith('AB_') ? 'گرم' : 'عدد' }}</span>
              </div>
            </td>
            <td class="amount-cell">
              <input 
                v-if="editingId === tx.id" 
                type="number" 
                v-model.number="editData.amount"
                class="edit-input large-input"
              />
              <span v-else class="large-number amount">
                {{ formatNumberWithComma(tx.amount) }}
              </span>
              <span class="unit">ریال</span>
            </td>
            <td class="price-cell">
              <input 
                v-if="editingId === tx.id" 
                type="number" 
                v-model.number="editData.transaction_price"
                class="edit-input large-input"
              />
              <span v-else class="large-number price">
                {{ formatNumberWithComma(tx.transaction_price) }}
              </span>
              <span class="unit">ریال</span>
            </td>
            <td class="status-cell">
              <select v-if="editingId === tx.id" v-model="editData.status" class="edit-select">
                <option value="pending">در انتظار</option>
                <option value="approved">تأیید شده</option>
                <option value="rejected">رد شده</option>
                <option value="expired">منقضی شده</option>
              </select>
              <span v-else :class="'status-badge status-' + tx.status">
                {{ getStatusText(tx.status) }}
              </span>
            </td>
            <td class="datetime-cell">
              <div class="datetime-info">
                <span class="persian-date">{{ formatPersianDate(tx.created_at) }}</span>
                <span class="persian-time">{{ formatPersianTime(tx.created_at) }}</span>
              </div>
            </td>
            <td class="actions-cell">
              <div v-if="editingId === tx.id" class="action-buttons">
                <button @click="saveTransaction(tx)" class="btn-save" :disabled="saving">💾 ذخیره</button>
                <button @click="cancelEdit" class="btn-cancel">❌ انصراف</button>
              </div>
              <div v-else class="action-buttons">
                <button @click="startEdit(tx)" class="btn-edit">✏️ ویرایش</button>
              </div>
            </td>
          </tr>
          <tr v-if="transactions.length === 0">
            <td colspan="10" class="empty">هیچ تراکنشی یافت نشد</td>
          </tr>
        </tbody>
       </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '@/core/http/axios';
import Vue3PersianDateTimePicker from 'vue3-persian-datetime-picker';
import moment from 'moment-jalaali';

moment.loadPersian({ dialect: 'persian-modern' });

const transactions = ref<any[]>([]);
const users = ref<any[]>([]);
const meltedProducts = ref<any[]>([]);
const coinProducts = ref<any[]>([]);
const loading = ref(true);
const saving = ref(false);
const editingId = ref<number | null>(null);
const editData = ref<any>({});
const userSearch = ref('');
const tempStartDate = ref('');
const tempEndDate = ref('');
const activeDateRange = ref('');

const dateTimeConfig = {
  time: false,
  hour24: true,
  format: 'jYYYY-jMM-jDD',
  placeholder: 'انتخاب تاریخ',
  locale: 'fa',
  autoSubmit: true,
  showTime: false,
  showTodayButton: true,
  showNowButton: false,
  closeOnSelect: true,
  formatDisplay: 'jYYYY-jMM-jDD',
  displayFormat: 'jYYYY-jMM-jDD'
};

const filters = ref({
  status: '',
  start_date: '',
  end_date: '',
  user_id: ''
});

let searchTimeout: any = null;

const pendingCount = computed(() => transactions.value.filter(tx => tx.status === 'pending').length);
const approvedCount = computed(() => transactions.value.filter(tx => tx.status === 'approved').length);
const rejectedCount = computed(() => transactions.value.filter(tx => tx.status === 'rejected').length);

const toPersianNumber = (num: number | string): string => {
  if (num === undefined || num === null) return '۰';
  const str = String(num);
  const persianNumbers: { [key: string]: string } = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  return str.replace(/[0-9]/g, (char) => persianNumbers[char] || char);
};

const formatNumberWithComma = (num: number | string | null | undefined): string => {
  if (!num && num !== 0) return '۰';
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numValue) || numValue === 0) return '۰';
  
  const parts = numValue.toString().split('.');
  const integerPart = Math.floor(numValue).toLocaleString('en-US');
  const formatted = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
  
  return toPersianNumber(formatted);
};

const formatWeight = (weight: number | null | undefined): string => {
  if (!weight && weight !== 0) return '۰';
  const rounded = Math.round(weight * 1000) / 1000;
  const parts = rounded.toString().split('.');
  const integerPart = parseInt(parts[0]).toLocaleString('en-US');
  
  if (parts.length > 1) {
    const decimalPart = parts[1].padEnd(3, '0').slice(0, 3);
    const result = `${integerPart}.${decimalPart}`;
    return toPersianNumber(result);
  }
  return toPersianNumber(integerPart);
};

const formatCoinCount = (count: number | null | undefined): string => {
  if (!count && count !== 0) return '۰';
  return toPersianNumber(Math.floor(count).toLocaleString('en-US'));
};

const formatPersianDate = (date: string) => {
  if (!date) return '-';
  return moment(date).format('jYYYY-jMM-jDD');
};

const formatPersianTime = (date: string) => {
  if (!date) return '-';
  const time = moment(date).format('HH:mm:ss');
  return toPersianNumber(time);
};

const getTodayDate = () => {
  return moment().format('YYYY-MM-DD');
};

const getTodayJalali = () => {
  return moment().format('jYYYY-jMM-jDD');
};

const applyDateFilter = () => {
  let startDate = '';
  let endDate = '';
  let rangeText = '';
  
  if (tempStartDate.value && tempEndDate.value) {
    startDate = moment(tempStartDate.value, 'jYYYY-jMM-jDD').format('YYYY-MM-DD');
    endDate = moment(tempEndDate.value, 'jYYYY-jMM-jDD').format('YYYY-MM-DD');
    rangeText = `از ${tempStartDate.value} تا ${tempEndDate.value}`;
  } else if (tempStartDate.value && !tempEndDate.value) {
    startDate = moment(tempStartDate.value, 'jYYYY-jMM-jDD').format('YYYY-MM-DD');
    endDate = startDate;
    rangeText = `${tempStartDate.value}`;
  } else if (!tempStartDate.value && tempEndDate.value) {
    startDate = moment(tempEndDate.value, 'jYYYY-jMM-jDD').format('YYYY-MM-DD');
    endDate = startDate;
    rangeText = `${tempEndDate.value}`;
  }
  
  filters.value.start_date = startDate;
  filters.value.end_date = endDate;
  activeDateRange.value = rangeText;
  
  loadTransactions();
};

const clearDateFilter = () => {
  tempStartDate.value = '';
  tempEndDate.value = '';
  filters.value.start_date = '';
  filters.value.end_date = '';
  activeDateRange.value = '';
  loadTransactions();
};

const loadTodayTransactions = () => {
  const today = getTodayDate();
  const todayJalali = getTodayJalali();
  
  tempStartDate.value = todayJalali;
  tempEndDate.value = todayJalali;
  filters.value.start_date = today;
  filters.value.end_date = today;
  activeDateRange.value = `امروز - ${todayJalali}`;
  
  loadTransactions();
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

const loadProducts = async () => {
  try {
    const response = await api.get('/prices/products');
    if (response.data.success) {
      meltedProducts.value = response.data.data?.melted || [];
      coinProducts.value = response.data.data?.coins || [];
    }
  } catch (err) {
    // خطا را نادیده بگیر
  }
};

const onProductChange = () => {
  const selectedCode = editData.value.product_code;
  
  let product = meltedProducts.value.find(p => p.code === selectedCode);
  
  if (!product) {
    product = coinProducts.value.find(p => p.code === selectedCode);
  }
  
  if (product) {
    editData.value.display_name = product.display_name || product.name;
    // اگر محصول تغییر کرد، مقدار quantity را ریست کنید
    if (selectedCode?.startsWith('AB_')) {
      editData.value.quantity = null;
    } else if (selectedCode?.startsWith('COIN_')) {
      editData.value.quantity = null;
    }
  }
};

const searchUsers = async () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    if (!userSearch.value || userSearch.value.length < 2) {
      users.value = [];
      return;
    }
    try {
      const response = await api.get(`/admin/users?search=${userSearch.value}&limit=10`);
      if (response.data.success) {
        users.value = response.data.data || [];
      }
    } catch (err) {
      // خطا را نادیده بگیر
    }
  }, 500);
};

const loadTransactions = async () => {
  loading.value = true;
  try {
    let url = `/transactions/admin/all?page=1&limit=500`;
    if (filters.value.start_date) url += `&start_date=${filters.value.start_date}`;
    if (filters.value.end_date) url += `&end_date=${filters.value.end_date}`;
    if (filters.value.status) url += `&status=${filters.value.status}`;
    if (filters.value.user_id) url += `&user_id=${filters.value.user_id}`;
    
    const response = await api.get(url);
    if (response.data.success) {
      transactions.value = response.data.data || [];
    }
  } catch (err) {
    // خطا را نادیده بگیر
  } finally {
    loading.value = false;
  }
};

const startEdit = async (tx: any) => {
  // اطمینان از بارگذاری محصولات
  if (meltedProducts.value.length === 0 && coinProducts.value.length === 0) {
    await loadProducts();
  }
  
  editingId.value = tx.id;
  editData.value = {
    id: tx.id,
    product_code: tx.product_code,
    display_name: tx.display_name,
    type: tx.type,
    quantity: tx.coin_quantity || tx.melted_weight,
    amount: tx.amount,
    transaction_price: tx.transaction_price,
    status: tx.status
  };
};

const cancelEdit = () => {
  editingId.value = null;
  editData.value = {};
};

const saveTransaction = async (tx: any) => {
  saving.value = true;
  try {
    const data: any = {
      status: editData.value.status
    };
    
    if (editData.value.type !== tx.type) data.type = editData.value.type;
    if (editData.value.amount !== tx.amount && editData.value.amount > 0) data.amount = Math.floor(editData.value.amount);
    if (editData.value.transaction_price !== tx.transaction_price && editData.value.transaction_price > 0) {
      data.transaction_price = Math.floor(editData.value.transaction_price);
    }
    
    // بررسی تغییر product_code
    const productCodeChanged = editData.value.product_code !== tx.product_code;
    if (productCodeChanged) {
      data.product_code = editData.value.product_code;
      
      // پیدا کردن محصول جدید و دریافت display_name
      let product = meltedProducts.value.find(p => p.code === editData.value.product_code);
      if (!product) {
        product = coinProducts.value.find(p => p.code === editData.value.product_code);
      }
      if (product) {
        data.display_name = product.display_name || product.name;
      }
    }
    
    // بررسی تغییر quantity
    const quantityChanged = editData.value.quantity !== undefined && 
                           editData.value.quantity !== null && 
                           editData.value.quantity !== '';
    
    if (quantityChanged) {
      const currentProductCode = productCodeChanged ? editData.value.product_code : tx.product_code;
      
      if (currentProductCode?.startsWith('AB_')) {
        const parsedWeight = parseFloat(editData.value.quantity);
        if (!isNaN(parsedWeight) && parsedWeight > 0) {
          data.melted_weight = parsedWeight;
        }
      } else if (currentProductCode?.startsWith('COIN_')) {
        const parsedCoin = parseInt(editData.value.quantity);
        if (!isNaN(parsedCoin) && parsedCoin > 0) {
          data.coin_quantity = parsedCoin;
        }
      }
    }
    
    // اگر هیچ داده‌ای برای به‌روزرسانی وجود ندارد
    if (Object.keys(data).length === 1 && data.status) {
      alert('تغییری اعمال نشده است');
      cancelEdit();
      return;
    }
    
    const response = await api.put(`/transactions/admin/${tx.id}`, data);
    
    if (response.data.success) {
      await loadTransactions();
      alert('تراکنش با موفقیت ویرایش شد');
      cancelEdit();
    } else {
      alert(response.data.error || 'خطا در ذخیره تغییرات');
    }
  } catch (err: any) {
    console.error('Error saving transaction:', err);
    alert(err.response?.data?.error || 'خطا در ذخیره تغییرات');
  } finally {
    saving.value = false;
  }
};

const resetFilters = () => {
  tempStartDate.value = '';
  tempEndDate.value = '';
  filters.value = { status: '', start_date: '', end_date: '', user_id: '' };
  userSearch.value = '';
  users.value = [];
  activeDateRange.value = '';
  loadTodayTransactions();
};

onMounted(() => {
  loadProducts();
  loadTodayTransactions();
});
</script>

<style scoped>
.admin-transactions-page { 
  background: white; 
  border-radius: 12px; 
  padding: 20px; 
  direction: rtl;
}
.admin-transactions-page h1 { 
  margin: 0 0 20px; 
  font-size: 24px; 
  color: #333; 
}

.filters-card { 
  background: #f8f9fa; 
  border-radius: 12px; 
  padding: 16px; 
  margin-bottom: 20px; 
}
.filters-row { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 16px; 
  align-items: flex-end; 
}
.filter-group { 
  display: flex; 
  flex-direction: column; 
  gap: 6px; 
}
.filter-group label { 
  font-size: 12px; 
  color: #666; 
}
.filter-group select, 
.filter-group input { 
  padding: 8px 12px; 
  border: 1px solid #ddd; 
  border-radius: 8px; 
  font-size: 13px; 
  min-width: 150px;
}
.user-select { 
  margin-top: 8px; 
}
.btn-search, .btn-reset, .btn-today { 
  border: none; 
  padding: 8px 20px; 
  border-radius: 8px; 
  cursor: pointer; 
  font-size: 13px;
  font-weight: 500;
}
.btn-search { 
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white; 
}
.btn-reset { 
  background: #95a5a6; 
  color: white; 
}
.btn-today { 
  background: #3498db; 
  color: white; 
}

.active-filter-badge {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: #e8f0fe;
  padding: 8px 16px;
  border-radius: 20px;
  margin-bottom: 20px;
  font-size: 13px;
}
.active-filter-badge button {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 14px;
  padding: 0 4px;
}
.active-filter-badge button:hover {
  color: #e74c3c;
}

.filter-group :deep(.vpd-picker) {
  width: 200px;
}
.filter-group :deep(.vpd-input) {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  cursor: pointer;
  width: 100%;
}
.filter-group :deep(.vpd-input:focus) {
  outline: none;
  border-color: #667eea;
}

.stats-row { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 16px; 
  margin-bottom: 20px; 
}
.stat-item { 
  background: #f8f9fa; 
  border-radius: 12px; 
  padding: 12px 20px; 
  flex: 1; 
  text-align: center; 
}
.stat-label { 
  display: block; 
  font-size: 12px; 
  color: #666; 
  margin-bottom: 6px; 
}
.stat-value { 
  display: block; 
  font-size: 20px; 
  font-weight: bold; 
  color: #333; 
}
.pending-stats { color: #f39c12; }
.approved-stats { color: #27ae60; }
.rejected-stats { color: #e74c3c; }

.loading-state { 
  text-align: center; 
  padding: 40px; 
}
.spinner { 
  width: 32px; 
  height: 32px; 
  border: 3px solid #f3f3f3; 
  border-top: 3px solid #667eea; 
  border-radius: 50%; 
  animation: spin 1s linear infinite; 
  margin: 0 auto 12px; 
}
@keyframes spin { 
  0% { transform: rotate(0deg); } 
  100% { transform: rotate(360deg); } 
}

.table-container { 
  overflow-x: auto; 
}
table { 
  width: 100%; 
  border-collapse: collapse; 
  min-width: 1400px; 
}
th, td { 
  padding: 14px 12px; 
  text-align: center; 
  border-bottom: 1px solid #eee; 
}
th { 
  background: #f8f9fa; 
  font-weight: 600; 
  font-size: 13px; 
}

tr.editing { 
  background: #fff8e1; 
}

.large-number { 
  font-size: 18px; 
  font-weight: bold; 
  font-family: monospace; 
  display: inline-block; 
  direction: ltr;
}
.large-number.amount { color: #27ae60; }
.large-number.price { color: #3498db; }
.unit { 
  font-size: 11px; 
  color: #999; 
  margin-right: 2px; 
}

.edit-input { 
  padding: 6px 10px; 
  border: 1px solid #ddd; 
  border-radius: 6px; 
  font-size: 14px; 
  width: 140px; 
  text-align: center; 
}
.large-input { 
  font-size: 16px; 
  font-weight: bold; 
}
.edit-select { 
  padding: 6px 10px; 
  border: 1px solid #ddd; 
  border-radius: 6px; 
  font-size: 13px; 
  background: white; 
}
.product-select { 
  min-width: 220px; 
}

.user-info-cell { 
  display: flex; 
  flex-direction: column; 
  gap: 2px; 
}
.user-name { 
  font-weight: 500; 
}
.user-mobile { 
  font-size: 11px; 
  color: #666; 
}
.user-code { 
  font-size: 10px; 
  color: #999; 
}

.tx-id { 
  font-family: monospace; 
  color: #999; 
  font-size: 12px; 
}
.product-name { 
  font-weight: 500; 
}
.product-code-small { 
  font-size: 10px; 
  color: #999; 
  margin-right: 4px; 
}

.type-buy { 
  color: #27ae60; 
  font-weight: 500; 
  font-size: 14px; 
}
.type-sell { 
  color: #e74c3c; 
  font-weight: 500; 
  font-size: 14px; 
}

.status-badge { 
  display: inline-block; 
  padding: 4px 10px; 
  border-radius: 20px; 
  font-size: 12px; 
  font-weight: 500; 
}
.status-pending { background: #fff3e0; color: #f39c12; }
.status-approved { background: #e8f5e9; color: #27ae60; }
.status-rejected { background: #ffebee; color: #e74c3c; }
.status-expired { background: #e0e0e0; color: #757575; }

.datetime-cell {
  min-width: 120px;
}
.datetime-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}
.persian-date {
  font-size: 13px;
  font-weight: 500;
  color: #2c3e50;
  font-family: monospace;
}
.persian-time {
  font-size: 11px;
  color: #7f8c8d;
  font-family: monospace;
}

.action-buttons { 
  display: flex; 
  gap: 8px; 
  justify-content: center; 
}
.btn-edit, .btn-save, .btn-cancel { 
  border: none; 
  padding: 5px 12px; 
  border-radius: 6px; 
  cursor: pointer; 
  font-size: 13px; 
}
.btn-edit { background: #3498db; color: white; }
.btn-save { background: #27ae60; color: white; }
.btn-cancel { background: #95a5a6; color: white; }

.empty { 
  text-align: center; 
  color: #999; 
  padding: 40px; 
}

:deep(.vpd-picker) {
  font-family: inherit;
}
:deep(.vpd-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
:deep(.vpd-header .vpd-header-title) {
  color: white;
}
:deep(.vpd-body .vpd-cell.selected) {
  background: #667eea;
  color: white;
}
:deep(.vpd-body .vpd-cell.today) {
  border: 1px solid #667eea;
}
:deep(.vdp-popup) {
  z-index: 10000;
}

@media (max-width: 768px) {
  .admin-transactions-page { padding: 12px; }
  th, td { padding: 8px; font-size: 12px; }
  .large-number { font-size: 14px; }
  .edit-input { width: 100px; font-size: 12px; }
  .filter-group :deep(.vpd-picker) { width: 160px; }
  .datetime-info { gap: 2px; }
  .persian-date { font-size: 11px; }
  .persian-time { font-size: 9px; }
  .product-select { min-width: 180px; }
  .btn-search, .btn-reset, .btn-today { padding: 6px 12px; font-size: 11px; }
}
</style>