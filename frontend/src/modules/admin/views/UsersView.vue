<template>
  <div class="users-page">
    <h1>مدیریت کاربران</h1>

    <div class="toolbar">
      <button @click="showCreateModal = true" class="btn-create">+ کاربر جدید</button>
      <input
        type="text"
        v-model="search"
        placeholder="جستجوی کاربر..."
        @input="loadUsers"
        class="search-input"
      />
    </div>

    <div class="table-container">
      <table dir="rtl">
        <thead>
          <tr>
            <th>کد کاربر</th>
            <th>نام و نام خانوادگی</th>
            <th>شماره موبایل</th>
            <th>افست آبشده (تومان)</th>
            <th>افست سکه (تومان)</th>
            <th>محدودیت دستگاه</th>
            <th>وضعیت</th>
            <th>تاریخ ثبت</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.code }}</td>
            <td>{{ user.full_name || '-' }}</td>
            <td>{{ user.mobile_number }}</td>
            <td>
              <input 
                type="text" 
                :value="formatNumberWithCommas(user.melted_price_offset_display)"
                @focus="onFocus(user, 'melted')"
                @blur="onBlur(user, 'melted', $event.target.value)"
                class="offset-input"
              />
            </td>
            <td>
              <input 
                type="text" 
                :value="formatNumberWithCommas(user.coin_price_offset_display)"
                @focus="onFocus(user, 'coin')"
                @blur="onBlur(user, 'coin', $event.target.value)"
                class="offset-input"
              />
            </td>
            <td>
              <input 
                type="number" 
                v-model.number="user.device_limit"
                @change="updateDeviceLimit(user)"
                class="device-input"
                min="1"
              />
            </td>
            <td>
              <span :class="user.is_blocked ? 'blocked' : 'active'">
                {{ user.is_blocked ? 'مسدود' : 'فعال' }}
              </span>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td class="actions">
              <button @click="editUser(user)" class="btn-edit" title="ویرایش">✏️</button>
              <button @click="toggleBlock(user)" class="btn-toggle" :title="user.is_blocked ? 'فعال کردن' : 'مسدود کردن'">
                {{ user.is_blocked ? '🔓' : '🔒' }}
              </button>
              <button @click="showSessions(user)" class="btn-sessions" title="نشست‌ها">🔌</button>
              <button @click="deleteUser(user)" class="btn-delete" title="حذف">🗑️</button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="9" class="empty">هیچ کاربری یافت نشد</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- مودال ویرایش کاربر -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <h3>ویرایش کاربر</h3>
        <form @submit.prevent="updateUser">
          <div class="form-group">
            <label>کد کاربر</label>
            <input type="text" v-model="editUserData.code" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>نام</label>
              <input type="text" v-model="editUserData.first_name" />
            </div>
            <div class="form-group">
              <label>نام خانوادگی</label>
              <input type="text" v-model="editUserData.last_name" />
            </div>
          </div>
          <div class="form-group">
            <label>شماره موبایل</label>
            <input type="tel" v-model="editUserData.mobile_number" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>افست آبشده (ریال)</label>
              <input type="number" v-model.number="editUserData.melted_price_offset" />
            </div>
            <div class="form-group">
              <label>افست سکه (ریال)</label>
              <input type="number" v-model.number="editUserData.coin_price_offset" />
            </div>
          </div>
          <div class="form-group">
            <label>محدودیت دستگاه</label>
            <input type="number" v-model.number="editUserData.device_limit" min="1" />
          </div>
          <div class="modal-actions">
            <button type="submit" :disabled="loading" class="btn-save">
              {{ loading ? 'در حال ذخیره...' : 'ذخیره تغییرات' }}
            </button>
            <button type="button" @click="showEditModal = false" class="btn-cancel">انصراف</button>
          </div>
        </form>
      </div>
    </div>

    <!-- مودال نشست‌های کاربر -->
    <div v-if="showSessionsModal" class="modal">
      <div class="modal-content sessions-modal">
        <h3>نشست‌های فعال کاربر</h3>
        <p class="user-info">{{ sessionsUser?.full_name }} ({{ sessionsUser?.mobile_number }})</p>
        <div class="sessions-list">
          <div v-for="session in userSessions" :key="session.id" class="session-item">
            <div class="session-info">
              <span>🌐 IP: {{ session.ip_address || 'نامشخص' }}</span>
              <span>📅 آخرین فعالیت: {{ formatDate(session.last_activity) }}</span>
              <span>⏰ انقضا: {{ formatDate(session.expires_at) }}</span>
            </div>
            <button @click="revokeSession(session.id)" class="btn-revoke">باطل کردن</button>
          </div>
          <div v-if="userSessions.length === 0" class="empty-sessions">هیچ نشست فعالی وجود ندارد</div>
        </div>
        <div class="modal-actions">
          <button @click="revokeAllSessions" class="btn-revoke-all">باطل کردن تمام نشست‌ها</button>
          <button @click="showSessionsModal = false" class="btn-cancel">بستن</button>
        </div>
      </div>
    </div>

    <!-- مودال ایجاد کاربر جدید -->
    <div v-if="showCreateModal" class="modal">
      <div class="modal-content">
        <h3>ایجاد کاربر جدید</h3>
        <form @submit.prevent="createUser">
          <div class="form-group">
            <label>شماره موبایل *</label>
            <input type="tel" v-model="newUser.mobile_number" required placeholder="09123456789" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>نام</label>
              <input type="text" v-model="newUser.first_name" />
            </div>
            <div class="form-group">
              <label>نام خانوادگی</label>
              <input type="text" v-model="newUser.last_name" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="submit" :disabled="loading" class="btn-save">
              {{ loading ? 'در حال ثبت...' : 'ثبت' }}
            </button>
            <button type="button" @click="showCreateModal = false" class="btn-cancel">انصراف</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { api } from '@/core/http/axios';

// تابع فرمت اعداد با جداکننده سه رقم سه رقم
const formatNumberWithCommas = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '۰';
  if (num === 0) return '۰';
  
  // تبدیل به رشته و جدا کردن سه رقم سه رقم از سمت راست
  const numStr = Math.abs(num).toString();
  const formatted = numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // اضافه کردن علامت منفی اگر عدد منفی باشد
  const result = num < 0 ? `-${formatted}` : formatted;
  
  // تبدیل اعداد انگلیسی به فارسی برای نمایش بهتر
  const persianDigits: Record<string, string> = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  
  return result.replace(/[0-9]/g, d => persianDigits[d]);
};

// تبدیل رشته فرمت شده به عدد
const parseFormattedNumber = (str: string): number => {
  if (!str) return 0;
  // حذف ویرگول‌ها و تبدیل اعداد فارسی به انگلیسی
  let cleaned = str.replace(/,/g, '');
  const persianToEnglish: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };
  cleaned = cleaned.replace(/[۰-۹]/g, d => persianToEnglish[d] || d);
  return parseInt(cleaned, 10) || 0;
};

// ذخیره مقدار قبلی برای هر کاربر در حالت فوکوس
const originalValues = reactive<Record<number, { melted: number; coin: number }>>({});

const users = ref<any[]>([]);
const search = ref('');
const loading = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showSessionsModal = ref(false);
const editUserData = ref<any>({});
const sessionsUser = ref<any>(null);
const userSessions = ref<any[]>([]);

const newUser = ref({
  mobile_number: '',
  first_name: '',
  last_name: ''
});

const formatDate = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fa-IR') + ' ' + d.toLocaleTimeString('fa-IR');
};

// اضافه کردن فیلد نمایشی به هر کاربر
const enhanceUserWithDisplayFields = (user: any) => {
  user.melted_price_offset_display = user.melted_price_offset || 0;
  user.coin_price_offset_display = user.coin_price_offset || 0;
  return user;
};

const loadUsers = async () => {
  try {
    let url = '/admin/users';
    if (search.value) {
      url += `?search=${search.value}`;
    }
    const response = await api.get(url);
    if (response.data.success) {
      // فقط کاربرانی که ادمین نیستند
      const nonAdminUsers = (response.data.data || []).filter((u: any) => !u.is_admin);
      users.value = nonAdminUsers.map(enhanceUserWithDisplayFields);
      console.log('Users loaded (non-admin):', users.value.length);
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
};

const onFocus = (user: any, type: 'melted' | 'coin') => {
  // ذخیره مقدار اصلی
  if (!originalValues[user.id]) {
    originalValues[user.id] = { melted: 0, coin: 0 };
  }
  originalValues[user.id][type] = type === 'melted' ? user.melted_price_offset : user.coin_price_offset;
  
  // نمایش مقدار خام (بدون ویرگول) در فوکوس
  const rawValue = type === 'melted' ? user.melted_price_offset : user.coin_price_offset;
  const displayField = type === 'melted' ? 'melted_price_offset_display' : 'coin_price_offset_display';
  user[displayField] = rawValue !== null && rawValue !== undefined ? rawValue.toString() : '0';
};

const onBlur = async (user: any, type: 'melted' | 'coin', inputValue: string) => {
  const value = parseFormattedNumber(inputValue);
  const displayField = type === 'melted' ? 'melted_price_offset_display' : 'coin_price_offset_display';
  const originalValue = originalValues[user.id]?.[type] || 0;
  
  if (value === originalValue) {
    // اگر مقداری تغییر نکرده، فقط نمایش را به فرمت اصلی برگردان
    user[displayField] = originalValue;
    return;
  }
  
  try {
    const data = type === 'melted' 
      ? { melted_price_offset: value }
      : { coin_price_offset: value };
    await api.put(`/admin/users/${user.id}`, data);
    
    // به‌روزرسانی مقدار واقعی
    if (type === 'melted') {
      user.melted_price_offset = value;
      user.melted_price_offset_display = value;
    } else {
      user.coin_price_offset = value;
      user.coin_price_offset_display = value;
    }
    
    alert(`${type === 'melted' ? 'افست آبشده' : 'افست سکه'} با موفقیت به‌روزرسانی شد`);
  } catch (err) {
    console.error('Error updating offset:', err);
    alert('خطا در به‌روزرسانی افست');
    // برگرداندن مقدار قبلی
    if (type === 'melted') {
      user.melted_price_offset_display = originalValue;
    } else {
      user.coin_price_offset_display = originalValue;
    }
  }
};

const createUser = async () => {
  if (!newUser.value.mobile_number) {
    alert('شماره موبایل الزامی است');
    return;
  }
  
  loading.value = true;
  try {
    const response = await api.post('/admin/users', newUser.value);
    if (response.data.success) {
      await loadUsers();
      showCreateModal.value = false;
      newUser.value = { mobile_number: '', first_name: '', last_name: '' };
      alert('کاربر با موفقیت ایجاد شد');
    }
  } catch (err: any) {
    console.error('Error creating user:', err);
    alert(err.response?.data?.error || 'خطا در ایجاد کاربر');
  } finally {
    loading.value = false;
  }
};

const editUser = (user: any) => {
  editUserData.value = { ...user };
  showEditModal.value = true;
};

const updateUser = async () => {
  loading.value = true;
  try {
    const response = await api.put(`/admin/users/${editUserData.value.id}`, {
      code: editUserData.value.code,
      first_name: editUserData.value.first_name,
      last_name: editUserData.value.last_name,
      mobile_number: editUserData.value.mobile_number,
      melted_price_offset: editUserData.value.melted_price_offset,
      coin_price_offset: editUserData.value.coin_price_offset,
      device_limit: editUserData.value.device_limit
    });
    if (response.data.success) {
      await loadUsers();
      showEditModal.value = false;
      alert('اطلاعات کاربر با موفقیت به‌روزرسانی شد');
    }
  } catch (err: any) {
    console.error('Error updating user:', err);
    alert(err.response?.data?.error || 'خطا در به‌روزرسانی کاربر');
  } finally {
    loading.value = false;
  }
};

const updateDeviceLimit = async (user: any) => {
  try {
    await api.put(`/admin/users/${user.id}`, { device_limit: user.device_limit });
    alert('محدودیت دستگاه با موفقیت به‌روزرسانی شد');
  } catch (err) {
    console.error('Error updating device limit:', err);
    alert('خطا در به‌روزرسانی محدودیت دستگاه');
    await loadUsers();
  }
};

const toggleBlock = async (user: any) => {
  try {
    await api.put(`/admin/users/${user.id}`, { is_blocked: !user.is_blocked });
    await loadUsers();
  } catch (err) {
    console.error('Error toggling user block:', err);
    alert('خطا در تغییر وضعیت کاربر');
  }
};

const deleteUser = async (user: any) => {
  if (confirm(`آیا از حذف کاربر ${user.full_name || user.mobile_number} اطمینان دارید؟`)) {
    try {
      await api.delete(`/admin/users/${user.id}`);
      await loadUsers();
      alert('کاربر با موفقیت حذف شد');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('خطا در حذف کاربر');
    }
  }
};

const showSessions = async (user: any) => {
  sessionsUser.value = user;
  userSessions.value = [];
  showSessionsModal.value = true;
  
  try {
    const response = await api.get(`/admin/users/${user.id}/sessions`);
    if (response.data.success) {
      userSessions.value = response.data.data || [];
    }
  } catch (err) {
    console.error('Error loading sessions:', err);
    alert('خطا در دریافت نشست‌ها');
  }
};

const revokeSession = async (sessionId: number) => {
  if (confirm('آیا از باطل کردن این نشست اطمینان دارید؟')) {
    try {
      await api.delete(`/admin/user-sessions/${sessionId}`);
      await showSessions(sessionsUser.value);
      alert('نشست با موفقیت باطل شد');
    } catch (err) {
      console.error('Error revoking session:', err);
      alert('خطا در باطل کردن نشست');
    }
  }
};

const revokeAllSessions = async () => {
  if (confirm('آیا از باطل کردن تمام نشست‌های این کاربر اطمینان دارید؟')) {
    try {
      await api.delete(`/admin/users/${sessionsUser.value.id}/sessions/all`);
      await showSessions(sessionsUser.value);
      alert('تمام نشست‌ها با موفقیت باطل شدند');
    } catch (err) {
      console.error('Error revoking all sessions:', err);
      alert('خطا در باطل کردن نشست‌ها');
    }
  }
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.users-page {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.users-page h1 {
  margin: 0 0 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.btn-create {
  background: #27ae60;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
}

.offset-input {
  width: 130px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: right;
  direction: ltr;
}

.device-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

.active {
  color: #27ae60;
}

.blocked {
  color: #e74c3c;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-edit, .btn-toggle, .btn-sessions, .btn-delete {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-edit:hover { background: #3498db; color: white; }
.btn-toggle:hover { background: #f39c12; color: white; }
.btn-sessions:hover { background: #9b59b6; color: white; }
.btn-delete:hover { background: #e74c3c; color: white; }

.empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.sessions-modal {
  width: 650px;
}

.modal-content h3 {
  margin: 0 0 16px;
}

.user-info {
  background: #f0f0f0;
  padding: 8px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.sessions-list {
  max-height: 300px;
  overflow-y: auto;
}

.session-item {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.btn-revoke {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-revoke-all {
  background: #e67e22;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.empty-sessions {
  text-align: center;
  color: #999;
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: flex-end;
}

.btn-save {
  background: #27ae60;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-cancel {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>