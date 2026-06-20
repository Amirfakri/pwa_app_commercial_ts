<template>
  <div class="admin-notifications-page">
    <h1>🔔 مدیریت اعلان‌ها</h1>

    <div class="tabs">
      <button @click="activeTab = 'notifications'" :class="{ active: activeTab === 'notifications' }" class="tab-btn">📢 اعلان‌ها</button>
      <button @click="activeTab = 'daily-message'" :class="{ active: activeTab === 'daily-message' }" class="tab-btn">📝 پیام روزانه</button>
      <button @click="activeTab = 'sms'" :class="{ active: activeTab === 'sms' }" class="tab-btn">✉️ پیامک</button>
      <button @click="activeTab = 'logs'" :class="{ active: activeTab === 'logs' }" class="tab-btn">📋 لاگ‌ها</button>
    </div>

    <!-- ==================== تب اعلان‌ها ==================== -->
    <div v-if="activeTab === 'notifications'">
      <div class="create-card">
        <div class="card-header">
          <span class="card-icon">➕</span>
          <h2>ایجاد اعلان جدید</h2>
        </div>
        
        <form @submit.prevent="createNotification" class="create-form">
          <div class="form-row">
            <div class="form-group">
              <label>عنوان (اختیاری)</label>
              <input type="text" v-model="newNotification.title" placeholder="مثال: تخفیف ویژه" class="form-input" />
            </div>
            <div class="form-group">
              <label>نوع اعلان</label>
              <select v-model="newNotification.notification_type" class="form-select">
                <option value="info">ℹ️ اطلاع‌رسانی</option>
                <option value="success">✅ موفقیت</option>
                <option value="warning">⚠️ هشدار</option>
                <option value="error">❌ خطا</option>
                <option value="simple">📢 ساده</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>نوع ارسال</label>
              <select v-model="newNotification.send_type" class="form-select">
                <option value="public">🌍 عمومی (همه کاربران)</option>
                <option value="private">🔒 خصوصی (فقط کاربر مشخص)</option>
              </select>
            </div>
            
            <div v-if="newNotification.send_type === 'private'" class="form-group">
              <label>انتخاب کاربر</label>
              <div class="search-user-wrapper">
                <input type="text" v-model="userSearch" @input="searchUsers" placeholder="جستجوی کاربر (کد، نام، موبایل)..." class="form-input" />
                <div v-if="userSearchResults.length > 0" class="search-results-dropdown">
                  <div v-for="user in userSearchResults" :key="user.id" @click="selectUser(user)" class="search-result-item">
                    <span class="user-code">{{ user.code || '-' }}</span>
                    <span class="user-name">{{ user.full_name || '-' }}</span>
                    <span class="user-mobile">{{ user.mobile_number || '-' }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="newNotification.send_type === 'private' && selectedUser" class="form-group">
              <label>کاربر انتخاب شده:</label>
              <div class="selected-user">
                <span>{{ selectedUser.full_name }} ({{ selectedUser.code }})</span>
                <button type="button" @click="clearSelectedUser" class="clear-user">✕</button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>متن اعلان <span class="required">*</span></label>
            <textarea v-model="newNotification.message_text" rows="3" placeholder="متن اعلان را وارد کنید..." class="form-textarea" required></textarea>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="newNotification.is_active" />
                فعال
              </label>
            </div>
            <div class="form-group">
              <label>تاریخ شروع (اختیاری)</label>
              <Vue3PersianDateTimePicker 
                v-model="newNotification.start_date"
                :config="dateTimeConfig"
                placeholder="انتخاب تاریخ شروع"
              />
            </div>
            <div class="form-group">
              <label>تاریخ پایان (اختیاری)</label>
              <Vue3PersianDateTimePicker 
                v-model="newNotification.end_date"
                :config="dateTimeConfig"
                placeholder="انتخاب تاریخ پایان"
              />
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" :disabled="creating" class="btn-primary">{{ creating ? 'در حال ارسال...' : 'ارسال اعلان' }}</button>
          </div>
        </form>
      </div>

      <div class="list-card">
        <div class="card-header">
          <span class="card-icon">📋</span>
          <h2>لیست اعلان‌ها</h2>
          <div class="filter-group">
            <select v-model="notificationFilter" @change="loadNotifications" class="filter-select">
              <option value="">همه</option>
              <option value="true">فعال</option>
              <option value="false">غیرفعال</option>
            </select>
          </div>
        </div>

        <div v-if="loadingNotifications" class="loading-container">
          <div class="spinner"></div>
          <p>در حال بارگذاری...</p>
        </div>

        <div v-else-if="notifications.length === 0" class="empty-state">
          <div class="empty-content">
            <span class="empty-icon">🔔</span>
            <p>هیچ اعلانی یافت نشد</p>
          </div>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>شناسه</th>
                <th>عنوان</th>
                <th>متن</th>
                <th>نوع</th>
                <th>نوع ارسال</th>
                <th>کاربر هدف</th>
                <th>وضعیت</th>
                <th>تاریخ ایجاد</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in notifications" :key="item.id">
                <td>{{ item.id }}</td>
                <td>{{ item.title || '-' }}</td>
                <td class="message-cell">{{ item.message_text }}</td>
                <td><span :class="'badge badge-' + getTypeClass(item.notification_type)">{{ getTypeText(item.notification_type) }}</span></td>
                <td><span :class="item.target_user_id ? 'badge-private' : 'badge-public'">{{ item.target_user_id ? '🔒 خصوصی' : '🌍 عمومی' }}</span></td>
                <td>{{ item.target_user_name || '-' }}</td>
                <td><span :class="item.is_active ? 'badge-active' : 'badge-inactive'">{{ item.is_active ? 'فعال' : 'غیرفعال' }}</span></td>
                <td class="date-cell">{{ formatJalaliDateTime(item.created_at) }}</td>
                <td class="actions">
                  <button @click="editNotification(item)" class="btn-icon" title="ویرایش">✏️</button>
                  <button @click="deleteNotification(item.id)" class="btn-icon" title="حذف">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="notificationPagination.total > notificationPagination.limit" class="pagination-controls">
          <div class="pagination-info">صفحه {{ notificationPagination.page }} از {{ notificationPagination.pages }} ({{ formatNumber(notificationPagination.total) }} اعلان)</div>
          <div class="pagination-buttons">
            <button class="pagination-button" @click="goToNotificationPage(notificationPagination.page - 1)" :disabled="notificationPagination.page === 1 || loadingNotifications">⬅️ قبلی</button>
            <button class="pagination-button" @click="goToNotificationPage(notificationPagination.page + 1)" :disabled="notificationPagination.page === notificationPagination.pages || loadingNotifications">بعدی ➡️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== تب پیام روزانه ==================== -->
    <div v-if="activeTab === 'daily-message'">
      <div class="create-card">
        <div class="card-header">
          <span class="card-icon">📝</span>
          <h2>تنظیم پیام روزانه</h2>
        </div>
        <form @submit.prevent="saveDailyMessage" class="create-form">
          <div class="form-group">
            <label>متن پیام روزانه <span class="required">*</span></label>
            <textarea v-model="dailyMessageForm.message_text" rows="4" placeholder="پیام روزانه را وارد کنید..." class="form-textarea" required></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="dailyMessageForm.is_active" />
                فعال
              </label>
            </div>
            <div class="form-group">
              <label>تاریخ شروع (اختیاری)</label>
              <Vue3PersianDateTimePicker 
                v-model="dailyMessageForm.start_date"
                :config="dateTimeConfig"
                placeholder="انتخاب تاریخ شروع"
              />
            </div>
            <div class="form-group">
              <label>تاریخ پایان (اختیاری)</label>
              <Vue3PersianDateTimePicker 
                v-model="dailyMessageForm.end_date"
                :config="dateTimeConfig"
                placeholder="انتخاب تاریخ پایان"
              />
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" :disabled="savingDailyMessage" class="btn-primary">{{ savingDailyMessage ? 'در حال ذخیره...' : 'ذخیره پیام روزانه' }}</button>
          </div>
        </form>
      </div>

      <div class="list-card">
        <div class="card-header">
          <span class="card-icon">📋</span>
          <h2>تاریخچه پیام‌های روزانه</h2>
        </div>

        <div v-if="loadingDailyMessages" class="loading-container">
          <div class="spinner"></div>
          <p>در حال بارگذاری...</p>
        </div>

        <div v-else-if="dailyMessages.length === 0" class="empty-state">
          <div class="empty-content">
            <span class="empty-icon">📭</span>
            <p>هیچ پیامی یافت نشد</p>
          </div>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>شناسه</th>
                <th>متن پیام</th>
                <th>وضعیت</th>
                <th>تاریخ ایجاد</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in dailyMessages" :key="item.id">
                <td>{{ item.id }}</td>
                <td class="message-cell">{{ item.message_text }}</td>
                <td><span :class="item.is_active ? 'badge-active' : 'badge-inactive'">{{ item.is_active ? 'فعال' : 'غیرفعال' }}</span></td>
                <td class="date-cell">{{ formatJalaliDateTime(item.created_at) }}</td>
                <td class="actions">
                  <button @click="editDailyMessage(item)" class="btn-icon" title="ویرایش">✏️</button>
                  <button @click="deleteDailyMessage(item.id)" class="btn-icon" title="حذف">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== تب پیامک ==================== -->
    <div v-if="activeTab === 'sms'">
      <div class="create-card">
        <div class="card-header">
          <span class="card-icon">✉️</span>
          <h2>ارسال پیامک</h2>
        </div>
        
        <div class="search-section">
          <label>جستجوی گیرنده</label>
          <div class="search-wrapper">
            <input type="text" v-model="customerSearch" @input="searchCustomers" placeholder="کد کاربر، نام یا شماره موبایل..." class="search-input" />
            <div v-if="searchResults.length > 0" class="search-results">
              <div v-for="customer in searchResults" :key="customer.id" @click="selectCustomer(customer)" class="search-result">
                <span class="customer-name">{{ customer.full_name }}</span>
                <span class="customer-code">{{ customer.code }}</span>
                <span class="customer-mobile">{{ customer.mobile_number }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedRecipients.length > 0" class="recipients-list">
          <div class="recipients-header">
            <span>گیرندگان انتخاب شده ({{ selectedRecipients.length }})</span>
            <button @click="clearRecipients" class="clear-all">حذف همه</button>
          </div>
          <div class="recipients-tags">
            <div v-for="rec in selectedRecipients" :key="rec.id" class="recipient-tag">
              <span>{{ rec.full_name }} ({{ rec.mobile_number }})</span>
              <button @click="removeRecipient(rec.id)" class="remove-tag">✕</button>
            </div>
          </div>
        </div>

        <form @submit.prevent="sendSms" class="create-form">
          <div class="form-group">
            <label>شماره گیرنده (دستی)</label>
            <input type="text" v-model="manualRecipient" placeholder="09123456789" class="form-input" dir="ltr" />
          </div>
          <div class="form-group">
            <label>متن پیامک <span class="required">*</span></label>
            <textarea v-model="smsMessage" rows="5" placeholder="متن پیامک را وارد کنید..." class="form-textarea" required></textarea>
            <small class="char-count">{{ smsMessage.length }} / 500 کاراکتر</small>
          </div>
          <div class="form-actions">
            <button type="submit" :disabled="sendingSms" class="btn-primary">{{ sendingSms ? 'در حال ارسال...' : 'ارسال پیامک' }}</button>
            <button type="button" @click="sendBulkSms" :disabled="sendingSms" class="btn-secondary">ارسال گروهی به همه کاربران</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== تب لاگ‌ها ==================== -->
    <div v-if="activeTab === 'logs'">
      <div class="list-card">
        <div class="card-header">
          <span class="card-icon">📋</span>
          <h2>لاگ‌های ارسال پیامک</h2>
          <div class="filter-group">
            <select v-model="smsLogFilter" @change="loadSmsLogs" class="filter-select">
              <option value="">همه</option>
              <option value="sent">موفق</option>
              <option value="failed">ناموفق</option>
            </select>
          </div>
        </div>

        <div v-if="loadingSmsLogs" class="loading-container">
          <div class="spinner"></div>
          <p>در حال بارگذاری...</p>
        </div>

        <div v-else-if="smsLogs.length === 0" class="empty-state">
          <div class="empty-content">
            <span class="empty-icon">📭</span>
            <p>هیچ لاگی یافت نشد</p>
          </div>
        </div>

        <div v-else class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>شناسه</th>
                <th>گیرنده</th>
                <th>متن پیام</th>
                <th>وضعیت</th>
                <th>تاریخ ارسال</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in smsLogs" :key="item.id">
                <td>{{ item.id }}</td>
                <td class="receptor-cell">{{ item.receptor }}</td>
                <td class="message-cell">{{ item.message || '-' }}</td>
                <td><span :class="item.status === 'sent' ? 'badge-success' : 'badge-error'">{{ item.status === 'sent' ? 'موفق' : 'ناموفق' }}</span></td>
                <td class="date-cell">{{ formatJalaliDateTime(item.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="smsLogPagination.total > smsLogPagination.limit" class="pagination-controls">
          <div class="pagination-info">صفحه {{ smsLogPagination.page }} از {{ smsLogPagination.pages }} ({{ formatNumber(smsLogPagination.total) }} لاگ)</div>
          <div class="pagination-buttons">
            <button class="pagination-button" @click="goToSmsLogPage(smsLogPagination.page - 1)" :disabled="smsLogPagination.page === 1 || loadingSmsLogs">⬅️ قبلی</button>
            <button class="pagination-button" @click="goToSmsLogPage(smsLogPagination.page + 1)" :disabled="smsLogPagination.page === smsLogPagination.pages || loadingSmsLogs">بعدی ➡️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- مودال ویرایش اعلان -->
    <div v-if="editModal.show" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>ویرایش اعلان</h3>
          <button @click="closeEditModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>عنوان</label>
            <input type="text" v-model="editModal.data.title" class="form-input" />
          </div>
          <div class="form-group">
            <label>نوع</label>
            <select v-model="editModal.data.notification_type" class="form-select">
              <option value="info">اطلاع‌رسانی</option>
              <option value="success">موفقیت</option>
              <option value="warning">هشدار</option>
              <option value="error">خطا</option>
              <option value="simple">ساده</option>
            </select>
          </div>
          <div class="form-group">
            <label>متن</label>
            <textarea v-model="editModal.data.message_text" rows="3" class="form-textarea"></textarea>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="editModal.data.is_active" />
              فعال
            </label>
          </div>
          <div class="modal-actions">
            <button @click="updateNotification" :disabled="updating" class="btn-primary">{{ updating ? 'در حال ذخیره...' : 'ذخیره تغییرات' }}</button>
            <button @click="closeEditModal" class="btn-secondary">انصراف</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '@/core/http/axios';
import { formatJalaliDateTime } from '@/utils/dateUtils';
import Vue3PersianDateTimePicker from 'vue3-persian-datetime-picker';

// ==================== تنظیمات تقویم شمسی ====================
const dateTimeConfig = {
  time: true,           // فعال کردن ساعت
  hour24: true,         // ساعت 24 ساعته
  format: 'YYYY-MM-DD HH:mm:ss',
  placeholder: 'انتخاب تاریخ',
  locale: 'fa'
};

// ==================== Types ====================
interface Notification {
  id: number;
  title: string | null;
  message_text: string;
  notification_type: string;
  target_user_id?: number | null;
  target_user_name?: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface DailyMessage {
  id: number;
  message_text: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface SmsLog {
  id: string;
  receptor: string;
  message: string;
  status: string;
  created_at: string;
}

interface Customer {
  id: number;
  code: string;
  full_name: string;
  mobile_number: string;
}

interface User {
  id: number;
  code: string;
  full_name: string;
  mobile_number: string;
}

// ==================== State ====================
const activeTab = ref('notifications');

// Notification state
const notifications = ref<Notification[]>([]);
const loadingNotifications = ref(false);
const creating = ref(false);
const updating = ref(false);
const notificationFilter = ref('');
const notificationPagination = ref({ page: 1, limit: 20, total: 0, pages: 0 });

const newNotification = ref({
  title: '',
  message_text: '',
  notification_type: 'simple',
  send_type: 'public',
  target_user_id: null as number | null,
  is_active: true,
  start_date: '',
  end_date: ''
});

const userSearch = ref('');
const userSearchResults = ref<User[]>([]);
const selectedUser = ref<User | null>(null);
let userSearchTimeout: any = null;

const editModal = ref({ show: false, id: null as number | null, data: {} as any });

// Daily message state
const dailyMessages = ref<DailyMessage[]>([]);
const loadingDailyMessages = ref(false);
const savingDailyMessage = ref(false);
const dailyMessageForm = ref({
  message_text: '',
  is_active: true,
  start_date: '',
  end_date: ''
});

// SMS state
const customerSearch = ref('');
const searchResults = ref<Customer[]>([]);
const selectedRecipients = ref<Customer[]>([]);
const manualRecipient = ref('');
const smsMessage = ref('');
const sendingSms = ref(false);

// SMS logs
const smsLogs = ref<SmsLog[]>([]);
const loadingSmsLogs = ref(false);
const smsLogFilter = ref('');
const smsLogPagination = ref({ page: 1, limit: 20, total: 0, pages: 0 });

let searchTimeout: any = null;

// ==================== Helper Functions ====================
const formatNumber = (num: number): string => {
  if (!num && num !== 0) return '۰';
  return num.toLocaleString('fa-IR');
};

const getTypeText = (type: string): string => {
  const map: Record<string, string> = { info: 'ℹ️ اطلاع‌رسانی', success: '✅ موفقیت', warning: '⚠️ هشدار', error: '❌ خطا', simple: '📢 ساده' };
  return map[type] || type;
};

const getTypeClass = (type: string): string => {
  const map: Record<string, string> = { info: 'info', success: 'success', warning: 'warning', error: 'error', simple: 'simple' };
  return map[type] || 'simple';
};

// ==================== User Search Functions ====================
const searchUsers = async () => {
  if (userSearchTimeout) clearTimeout(userSearchTimeout);
  userSearchTimeout = setTimeout(async () => {
    const query = userSearch.value;
    if (!query || query.length < 2) { userSearchResults.value = []; return; }
    try {
      const response = await api.get('/admin/users', { params: { search: query, limit: 10 } });
      if (response.data.success) userSearchResults.value = response.data.data;
    } catch (err) { console.error('Error searching users:', err); }
  }, 500);
};

const selectUser = (user: User) => {
  selectedUser.value = user;
  newNotification.value.target_user_id = user.id;
  userSearch.value = `${user.full_name} (${user.code})`;
  userSearchResults.value = [];
};

const clearSelectedUser = () => {
  selectedUser.value = null;
  newNotification.value.target_user_id = null;
  userSearch.value = '';
};

// ==================== Notification Functions ====================
const loadNotifications = async () => {
  loadingNotifications.value = true;
  try {
    const params: any = { page: notificationPagination.value.page, limit: notificationPagination.value.limit };
    if (notificationFilter.value !== '') params.is_active = notificationFilter.value === 'true';
    const response = await api.get('/notifications', { params });
    if (response.data.success) {
      notifications.value = response.data.data;
      notificationPagination.value = response.data.pagination;
    }
  } catch (err) { console.error('Error loading notifications:', err); }
  finally { loadingNotifications.value = false; }
};

const createNotification = async () => {
  if (!newNotification.value.message_text) return;
  creating.value = true;
  try {
    const payload: any = {
      title: newNotification.value.title,
      message_text: newNotification.value.message_text,
      notification_type: newNotification.value.notification_type,
      is_active: newNotification.value.is_active,
      start_date: newNotification.value.start_date || null,
      end_date: newNotification.value.end_date || null
    };
    if (newNotification.value.send_type === 'private' && newNotification.value.target_user_id) payload.target_user_id = newNotification.value.target_user_id;
    const response = await api.post('/notifications', payload);
    if (response.data.success) {
      newNotification.value = { title: '', message_text: '', notification_type: 'simple', send_type: 'public', target_user_id: null, is_active: true, start_date: '', end_date: '' };
      selectedUser.value = null;
      userSearch.value = '';
      await loadNotifications();
      alert('✅ اعلان با موفقیت ارسال شد');
    }
  } catch (err: any) { console.error('Error creating notification:', err); alert('❌ خطا در ارسال اعلان'); }
  finally { creating.value = false; }
};

const editNotification = (item: Notification) => { editModal.value = { show: true, id: item.id, data: { ...item } }; };
const updateNotification = async () => {
  if (!editModal.value.id) return;
  updating.value = true;
  try {
    const response = await api.put(`/notifications/${editModal.value.id}`, editModal.value.data);
    if (response.data.success) { await loadNotifications(); closeEditModal(); alert('✅ اعلان با موفقیت به‌روزرسانی شد'); }
  } catch (err) { console.error('Error updating notification:', err); alert('❌ خطا در به‌روزرسانی اعلان'); }
  finally { updating.value = false; }
};

const deleteNotification = async (id: number) => {
  if (confirm('آیا از حذف این اعلان اطمینان دارید؟')) {
    try { await api.delete(`/notifications/${id}`); await loadNotifications(); alert('✅ اعلان با موفقیت حذف شد'); }
    catch (err) { console.error('Error deleting notification:', err); alert('❌ خطا در حذف اعلان'); }
  }
};

const closeEditModal = () => { editModal.value = { show: false, id: null, data: {} }; };
const goToNotificationPage = (page: number) => {
  if (page < 1 || page > notificationPagination.value.pages) return;
  notificationPagination.value.page = page;
  loadNotifications();
};

// ==================== Daily Message Functions ====================
const loadDailyMessages = async () => {
  loadingDailyMessages.value = true;
  try { const response = await api.get('/daily-messages'); if (response.data.success) dailyMessages.value = response.data.data; }
  catch (err) { console.error('Error loading daily messages:', err); }
  finally { loadingDailyMessages.value = false; }
};

const loadActiveDailyMessage = async () => {
  try {
    const response = await api.get('/daily-messages/active');
    if (response.data.success && response.data.data) {
      const msg = response.data.data;
      dailyMessageForm.value = { message_text: msg.message_text, is_active: msg.is_active, start_date: msg.start_date || '', end_date: msg.end_date || '' };
    }
  } catch (err) { console.error('Error loading active daily message:', err); }
};

const saveDailyMessage = async () => {
  if (!dailyMessageForm.value.message_text) return;
  savingDailyMessage.value = true;
  try {
    const response = await api.post('/daily-messages', dailyMessageForm.value);
    if (response.data.success) { await loadDailyMessages(); await loadActiveDailyMessage(); alert('✅ پیام روزانه با موفقیت ذخیره شد'); }
  } catch (err) { console.error('Error saving daily message:', err); alert('❌ خطا در ذخیره پیام روزانه'); }
  finally { savingDailyMessage.value = false; }
};

const editDailyMessage = (item: DailyMessage) => {
  dailyMessageForm.value = { message_text: item.message_text, is_active: item.is_active, start_date: item.start_date || '', end_date: item.end_date || '' };
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const deleteDailyMessage = async (id: number) => {
  if (confirm('آیا از حذف این پیام اطمینان دارید؟')) {
    try { await api.delete(`/daily-messages/${id}`); await loadDailyMessages(); await loadActiveDailyMessage(); alert('✅ پیام با موفقیت حذف شد'); }
    catch (err) { console.error('Error deleting daily message:', err); alert('❌ خطا در حذف پیام'); }
  }
};

// ==================== SMS Functions ====================
const searchCustomers = async () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const query = customerSearch.value;
    if (!query || query.length < 2) { searchResults.value = []; return; }
    try {
      const response = await api.get('/sms/customers/search', { params: { q: query, limit: 10 } });
      if (response.data.success) searchResults.value = response.data.data;
    } catch (err) { console.error('Error searching customers:', err); }
  }, 500);
};

const selectCustomer = (customer: Customer) => {
  if (!selectedRecipients.value.find(r => r.id === customer.id)) selectedRecipients.value.push(customer);
  customerSearch.value = '';
  searchResults.value = [];
};

const removeRecipient = (id: number) => { selectedRecipients.value = selectedRecipients.value.filter(r => r.id !== id); };
const clearRecipients = () => { selectedRecipients.value = []; };

const getRecipientsList = (): string[] => {
  const recipients: string[] = [];
  selectedRecipients.value.forEach(r => recipients.push(r.mobile_number));
  if (manualRecipient.value) recipients.push(manualRecipient.value);
  return recipients;
};

const sendSms = async () => {
  const receptors = getRecipientsList();
  if (receptors.length === 0) { alert('لطفاً حداقل یک گیرنده انتخاب کنید'); return; }
  if (!smsMessage.value) { alert('لطفاً متن پیامک را وارد کنید'); return; }
  sendingSms.value = true;
  try {
    const response = await api.post('/sms/send', { receptor: receptors[0], message: smsMessage.value });
    if (response.data.success) {
      alert('✅ پیامک با موفقیت ارسال شد');
      smsMessage.value = '';
      manualRecipient.value = '';
      selectedRecipients.value = [];
      await loadSmsLogs();
    }
  } catch (err: any) { console.error('Error sending SMS:', err); alert('❌ خطا در ارسال پیامک: ' + (err.response?.data?.error || 'خطای ناشناخته')); }
  finally { sendingSms.value = false; }
};

const sendBulkSms = async () => {
  if (!smsMessage.value) { alert('لطفاً متن پیامک را وارد کنید'); return; }
  if (!confirm('آیا از ارسال پیامک به همه کاربران اطمینان دارید؟')) return;
  sendingSms.value = true;
  try {
    const response = await api.post('/sms/send-bulk', { receptors: selectedRecipients.value.map(r => r.mobile_number), message: smsMessage.value });
    if (response.data.success) {
      alert(`✅ پیامک با موفقیت ارسال شد\nموفق: ${response.data.successCount}، ناموفق: ${response.data.failCount}`);
      smsMessage.value = '';
      selectedRecipients.value = [];
      await loadSmsLogs();
    }
  } catch (err: any) { console.error('Error sending bulk SMS:', err); alert('❌ خطا در ارسال گروهی پیامک: ' + (err.response?.data?.error || 'خطای ناشناخته')); }
  finally { sendingSms.value = false; }
};

// ==================== SMS Logs Functions ====================
const loadSmsLogs = async () => {
  loadingSmsLogs.value = true;
  try {
    const params: any = { page: smsLogPagination.value.page, limit: smsLogPagination.value.limit };
    if (smsLogFilter.value) params.status = smsLogFilter.value;
    const response = await api.get('/sms/logs', { params });
    if (response.data.success) {
      smsLogs.value = response.data.data;
      smsLogPagination.value = response.data.pagination;
    }
  } catch (err) { console.error('Error loading SMS logs:', err); }
  finally { loadingSmsLogs.value = false; }
};

const goToSmsLogPage = (page: number) => {
  if (page < 1 || page > smsLogPagination.value.pages) return;
  smsLogPagination.value.page = page;
  loadSmsLogs();
};

// ==================== Lifecycle ====================
onMounted(() => {
  loadNotifications();
  loadDailyMessages();
  loadActiveDailyMessage();
  loadSmsLogs();
});
</script>

<style scoped>
.admin-notifications-page {
  padding: 24px;
  background: #f5f6fa;
  min-height: 100vh;
}
.admin-notifications-page h1 {
  margin-bottom: 24px;
  color: #1a1a2e;
  font-size: 24px;
}
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: white;
  padding: 8px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.tab-btn {
  flex: 1;
  padding: 12px 20px;
  background: none;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: #666;
}
.tab-btn:hover { background: #f0f0f0; }
.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.create-card, .list-card {
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
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #667eea;
}
.card-icon { font-size: 24px; }
.card-header h2 { margin: 0; font-size: 18px; color: #333; flex: 1; }
.create-form { display: flex; flex-direction: column; gap: 16px; }
.form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.form-group { display: flex; flex-direction: column; }
.form-group label { margin-bottom: 8px; font-weight: 500; color: #555; font-size: 13px; }
.required { color: #e74c3c; }
.form-input, .form-select, .form-textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}
.form-textarea { resize: vertical; }
.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.char-count { font-size: 11px; color: #999; margin-top: 4px; text-align: left; }
.form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }

.btn-primary {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
}
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}
.filter-group { display: flex; align-items: center; gap: 10px; }
.filter-select { padding: 6px 12px; border: 1px solid #ddd; border-radius: 8px; }

.search-user-wrapper { position: relative; }
.search-results-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-height: 250px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.search-result-item {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.search-result-item:hover { background: #f8f9fa; }
.user-code { font-weight: 600; color: #667eea; }
.user-name { color: #333; }
.user-mobile { color: #999; font-size: 12px; }
.selected-user {
  background: #e8f5e9;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.clear-user { background: none; border: none; color: #e74c3c; cursor: pointer; }

.search-section { margin-bottom: 20px; }
.search-wrapper { position: relative; }
.search-input { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; }
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-height: 250px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.search-result {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.search-result:hover { background: #f8f9fa; }
.customer-name { font-weight: 600; color: #333; }
.customer-code { color: #667eea; font-size: 12px; }
.customer-mobile { color: #999; font-size: 12px; }

.recipients-list { margin-bottom: 20px; padding: 12px; background: #f8f9fa; border-radius: 12px; }
.recipients-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px; color: #666; }
.clear-all { background: none; border: none; color: #e74c3c; cursor: pointer; }
.recipients-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.recipient-tag {
  background: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #ddd;
}
.remove-tag { background: none; border: none; cursor: pointer; color: #999; }
.remove-tag:hover { color: #e74c3c; }

.table-container { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 12px; text-align: center; border-bottom: 1px solid #f0f0f0; }
.data-table th { background: #f8f9fa; font-weight: 600; color: #555; }
.message-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.receptor-cell { direction: ltr; font-family: monospace; }
.date-cell { font-size: 12px; direction: ltr; }

.badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
.badge-info { background: #e3f2fd; color: #1976d2; }
.badge-success { background: #e8f5e9; color: #27ae60; }
.badge-warning { background: #fff3e0; color: #f39c12; }
.badge-error { background: #ffebee; color: #e74c3c; }
.badge-simple { background: #f0f0f0; color: #666; }
.badge-public { background: #e3f2fd; color: #1976d2; }
.badge-private { background: #f3e5f5; color: #9c27b0; }
.badge-active { background: #e8f5e9; color: #27ae60; }
.badge-inactive { background: #ffebee; color: #e74c3c; }

.actions { display: flex; gap: 8px; justify-content: center; }
.btn-icon { background: none; border: none; font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
.btn-icon:hover { background: #f0f0f0; }

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
.pagination-info { font-size: 13px; color: #666; }
.pagination-buttons { display: flex; gap: 12px; }
.pagination-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
}
.pagination-button:disabled { opacity: 0.5; cursor: not-allowed; }

.loading-container { text-align: center; padding: 60px; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 60px; }
.empty-content { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty-icon { font-size: 48px; opacity: 0.5; }

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-container {
  background: white;
  border-radius: 20px;
  width: 500px;
  max-width: 95%;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}
.modal-body { padding: 20px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #999; }

/* استایل‌های تقویم شمسی */
:deep(.vpd-picker) {
  font-family: inherit;
}
:deep(.vpd-header) {
  background: #667eea;
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

@media (max-width: 768px) {
  .admin-notifications-page { padding: 16px; }
  .tabs { flex-wrap: wrap; }
  .tab-btn { flex: none; width: calc(50% - 4px); }
  .form-row { grid-template-columns: 1fr; }
  .message-cell { max-width: 100px; }
}
</style>