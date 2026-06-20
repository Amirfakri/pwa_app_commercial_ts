<template>
  <div class="admin-remittances-page">
    <h1>📦 مدیریت حواله‌ها</h1>

    <!-- کارت‌های آمار -->
    <div class="stats-cards">
      <div class="stat-card total" :class="{ 'has-new': stats.hasNew }">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <span class="stat-value">{{ formatNumber(stats.total) }}</span>
          <span class="stat-label">کل حواله‌ها</span>
        </div>
      </div>
      <div class="stat-card pending" :class="{ 'has-new': stats.pendingNew }">
        <div class="stat-icon">⏳</div>
        <div class="stat-info">
          <span class="stat-value">{{ formatNumber(stats.pending) }}</span>
          <span class="stat-label">در انتظار</span>
        </div>
      </div>
      <div class="stat-card approved">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <span class="stat-value">{{ formatNumber(stats.approved) }}</span>
          <span class="stat-label">تأیید شده</span>
        </div>
      </div>
      <div class="stat-card rejected">
        <div class="stat-icon">❌</div>
        <div class="stat-info">
          <span class="stat-value">{{ formatNumber(stats.rejected) }}</span>
          <span class="stat-label">رد شده</span>
        </div>
      </div>
      <div class="stat-card delivered">
        <div class="stat-icon">🚚</div>
        <div class="stat-info">
          <span class="stat-value">{{ formatNumber(stats.delivered) }}</span>
          <span class="stat-label">تحویل شده</span>
        </div>
      </div>
      <div class="stat-card today">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <span class="stat-value">{{ formatNumber(stats.today) }}</span>
          <span class="stat-label">امروز</span>
        </div>
      </div>
    </div>

    <!-- فیلترها -->
    <div class="filters-card">
      <div class="filters-row">
        <div class="filter-group">
          <label>وضعیت:</label>
          <select v-model="filters.status" @change="loadRemittances" class="filter-select">
            <option value="">همه</option>
            <option value="در حال بررسی">در انتظار</option>
            <option value="تأییدشده">تأیید شده</option>
            <option value="ردشده">رد شده</option>
            <option value="تحویل شده">تحویل شده</option>
          </select>
        </div>
        <div class="filter-group">
          <label>جستجو:</label>
          <input 
            type="text" 
            v-model="filters.search" 
            @input="debouncedSearch"
            placeholder="کد کاربر، نام، گیرنده..."
            class="search-input"
          />
        </div>
        <button @click="refreshData" class="btn-refresh" :disabled="loading">
          🔄 بروزرسانی
        </button>
      </div>
    </div>

    <!-- جدول حواله‌ها -->
    <div class="table-card">
      <div class="table-header">
        <h2>لیست حواله‌ها</h2>
        <span class="total-badge">تعداد: {{ formatNumber(pagination.total) }}</span>
      </div>

      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>در حال بارگذاری...</p>
      </div>

      <div v-else-if="remittances.length === 0" class="empty-state">
        <div class="empty-content">
          <span class="empty-icon">📭</span>
          <p>هیچ حواله‌ای یافت نشد</p>
        </div>
      </div>

      <div v-else class="table-container">
        <table dir="rtl">
          <thead>
            <tr>
              <th>شناسه</th>
              <th>کاربر</th>
              <th>نوع</th>
              <th>مقدار</th>
              <th>گیرنده</th>
              <th>وضعیت</th>
              <th>تاریخ</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in remittances" :key="item.id" :class="{ 'new-row': item.isNew, 'status-changed': item.id === lastChangedId }">
              <td class="id-cell">{{ item.id }}</td>
              <td class="user-cell">
                <div class="user-info">
                  <strong>{{ item.user_name }}</strong>
                  <span class="user-code">{{ item.user_code }}</span>
                </div>
              </td>
              <td>
                <span :class="'type-badge type-' + getTypeClass(item.type)">
                  {{ getTypeIcon(item.type) }} {{ item.type }}
                </span>
              </td>
              <td class="amount-cell">
                <strong>{{ formatAmount(item) }}</strong>
              </td>
              <td>{{ item.recipient }}</td>
              <td>
                <select 
                  :value="item.status" 
                  @change="updateStatus(item.id, $event)"
                  :class="'status-select status-' + getStatusClass(item.status)"
                >
                  <option value="در حال بررسی">⏳ در انتظار</option>
                  <option value="تأییدشده">✅ تأیید شده</option>
                  <option value="ردشده">❌ رد شده</option>
                  <option value="تحویل شده">🚚 تحویل شده</option>
                </select>
              </td>
              <td class="date-cell">{{ formatDateTime(item.created_at) }}</td>
              <td class="actions">
                <button @click="viewDetails(item)" class="btn-detail" title="مشاهده جزئیات">👁️</button>
                <button @click="deleteRemittance(item.id)" class="btn-delete" title="حذف">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-controls" v-if="pagination.total > pagination.limit">
        <div class="pagination-info">
          صفحه {{ pagination.page }} از {{ pagination.pages }}
          ({{ formatNumber(pagination.total) }} حواله)
        </div>
        <div class="pagination-buttons">
          <button 
            class="pagination-button"
            @click="goToPage(pagination.page - 1)"
            :disabled="pagination.page === 1 || loading"
          >
            ⬅️ قبلی
          </button>
          <button 
            class="pagination-button"
            @click="goToPage(pagination.page + 1)"
            :disabled="pagination.page === pagination.pages || loading"
          >
            بعدی ➡️
          </button>
        </div>
      </div>
    </div>

    <!-- مودال جزئیات -->
    <div v-if="detailModal.show" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-header-content">
            <span class="modal-icon">📦</span>
            <h3>جزئیات حواله #{{ detailModal.item?.id }}</h3>
          </div>
          <button @click="closeDetailModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid" v-if="detailModal.item">
            <div class="detail-item">
              <label>کاربر:</label>
              <span>{{ detailModal.item.user_name }} ({{ detailModal.item.user_code }})</span>
            </div>
            <div class="detail-item">
              <label>نوع حواله:</label>
              <span>{{ detailModal.item.type }}</span>
            </div>
            <div class="detail-item">
              <label>مقدار:</label>
              <span class="amount-highlight">{{ formatAmount(detailModal.item) }}</span>
            </div>
            <div class="detail-item">
              <label>گیرنده:</label>
              <span>{{ detailModal.item.recipient }}</span>
            </div>
            <div class="detail-item">
              <label>وضعیت:</label>
              <span :class="'status-badge status-' + getStatusClass(detailModal.item.status)">
                {{ detailModal.item.status }}
              </span>
            </div>
            <div class="detail-item">
              <label>تاریخ ثبت:</label>
              <span>{{ formatDateTimeFull(detailModal.item.created_at) }}</span>
            </div>
            <div class="detail-item-full" v-if="detailModal.item.description">
              <label>توضیحات:</label>
              <span class="description-text">{{ detailModal.item.description }}</span>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeDetailModal" class="btn-close-modal">بستن</button>
        </div>
      </div>
    </div>

    <!-- اعلان حواله جدید -->
    <div v-if="newRemittanceAlert.show" class="notification-toast new-remittance" @click="scrollToNewRow">
      <div class="notification-content">
        <span class="notification-icon">🆕</span>
        <div class="notification-text">
          <strong>حواله جدید!</strong>
          <p>{{ newRemittanceAlert.message }}</p>
        </div>
        <button class="notification-close" @click.stop="newRemittanceAlert.show = false">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { api } from '@/core/http/axios';
import { connectSocket, joinAdminRoom, onNewRemittance, onRemittanceStatusUpdate, offNewRemittance, offRemittanceStatusUpdate } from '@/core/socket/socket.io';

interface Remittance {
  id: number;
  user_id: number;
  user_name: string;
  user_code: string;
  user_mobile: string;
  type: string;
  weight: number | null;
  amount: number | null;
  coin_count: number | null;
  recipient: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  isNew?: boolean;
}

const remittances = ref<Remittance[]>([]);
const loading = ref(false);
const filters = ref({ status: '', search: '' });
const pagination = ref({ page: 1, limit: 50, total: 0, pages: 0 });
const stats = ref({
  total: 0, pending: 0, approved: 0, rejected: 0, delivered: 0, today: 0,
  hasNew: false, pendingNew: false
});
const detailModal = ref({ show: false, item: null as Remittance | null });
const newRemittanceAlert = ref({ show: false, message: '' });
const lastChangedId = ref<number | null>(null);
let searchTimeout: any = null;
let socketInitialized = false;

const formatNumber = (num: number): string => {
  if (!num && num !== 0) return '۰';
  return num.toLocaleString('fa-IR');
};

const formatAmount = (item: Remittance): string => {
  if (item.type === 'وزنی') {
    return (item.weight || 0).toLocaleString('fa-IR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' گرم';
  } else if (item.type === 'ریالی') {
    return (item.amount || 0).toLocaleString('fa-IR') + ' ریال';
  } else {
    return (item.coin_count || 0).toLocaleString('fa-IR') + ' عدد';
  }
};

const formatDateTime = (date: string): string => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fa-IR');
};

const formatDateTimeFull = (date: string): string => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fa-IR') + ' ' + d.toLocaleTimeString('fa-IR');
};

const getTypeIcon = (type: string): string => {
  switch(type) {
    case 'وزنی': return '🥇';
    case 'ریالی': return '💰';
    case 'سکه': return '🪙';
    default: return '📦';
  }
};

const getTypeClass = (type: string): string => {
  switch(type) {
    case 'وزنی': return 'weight';
    case 'ریالی': return 'rial';
    case 'سکه': return 'coin';
    default: return 'default';
  }
};

const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    'در حال بررسی': 'pending',
    'تأییدشده': 'approved',
    'ردشده': 'rejected',
    'تحویل شده': 'delivered'
  };
  return classes[status] || 'pending';
};

const loadStats = async () => {
  try {
    const response = await api.get('/remittances/admin/stats');
    if (response.data.success) {
      stats.value = { ...response.data.data, hasNew: false, pendingNew: false };
    }
  } catch (err) {
    console.error('Error loading stats:', err);
  }
};

const loadRemittances = async () => {
  loading.value = true;
  try {
    const response = await api.get('/remittances/admin', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.limit,
        status: filters.value.status || undefined,
        search: filters.value.search || undefined
      }
    });
    if (response.data.success) {
      remittances.value = response.data.data;
      pagination.value = response.data.pagination;
      stats.value = { ...response.data.stats, hasNew: false, pendingNew: false };
    }
  } catch (err) {
    console.error('Error loading remittances:', err);
  } finally {
    loading.value = false;
  }
};

const goToPage = (page: number) => {
  if (page < 1 || page > pagination.value.pages) return;
  pagination.value.page = page;
  loadRemittances();
};

const updateStatus = async (id: number, event: Event) => {
  const select = event.target as HTMLSelectElement;
  const newStatus = select.value;
  
  try {
    const response = await api.put(`/remittances/admin/${id}/status`, { status: newStatus });
    if (response.data.success) {
      const index = remittances.value.findIndex(r => r.id === id);
      if (index !== -1) {
        remittances.value[index].status = newStatus;
        remittances.value[index].updated_at = new Date().toISOString();
        lastChangedId.value = id;
        setTimeout(() => { lastChangedId.value = null; }, 1000);
      }
      await loadStats();
    }
  } catch (err) {
    console.error('Error updating status:', err);
    alert('خطا در به‌روزرسانی وضعیت');
    loadRemittances();
  }
};

const deleteRemittance = async (id: number) => {
  if (confirm('آیا از حذف این حواله اطمینان دارید؟')) {
    try {
      const response = await api.delete(`/remittances/admin/${id}`);
      if (response.data.success) {
        await loadRemittances();
        await loadStats();
      }
    } catch (err) {
      console.error('Error deleting remittance:', err);
      alert('خطا در حذف حواله');
    }
  }
};

const viewDetails = (item: Remittance) => {
  detailModal.value = { show: true, item };
};

const closeDetailModal = () => {
  detailModal.value = { show: false, item: null };
};

const refreshData = () => {
  loadStats();
  loadRemittances();
};

const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    loadRemittances();
  }, 500);
};

const scrollToNewRow = () => {
  const firstRow = document.querySelector('.new-row');
  if (firstRow) {
    firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      document.querySelectorAll('.new-row').forEach(row => row.classList.remove('new-row'));
    }, 3000);
  }
  newRemittanceAlert.value.show = false;
};

const addNewRemittance = (data: any) => {
  console.log('🎉 Adding new remittance to table:', data);
  const newRemittance = {
    ...data,
    isNew: true,
    user_name: data.user_name || 'کاربر',
    user_code: data.user_code,
    user_mobile: data.user_mobile
  };
  remittances.value = [newRemittance, ...remittances.value];
  
  stats.value.total++;
  if (data.status === 'در حال بررسی') {
    stats.value.pending++;
    stats.value.pendingNew = true;
  }
  stats.value.hasNew = true;
  
  newRemittanceAlert.value = {
    show: true,
    message: `حواله جدید از کاربر ${data.user_name || data.user_code}`
  };
  
  setTimeout(() => {
    document.querySelectorAll('.new-row').forEach(row => row.classList.remove('new-row'));
    stats.value.hasNew = false;
    stats.value.pendingNew = false;
  }, 5000);
};

const updateRemittanceStatusRealtime = (data: any) => {
  console.log('🔄 Updating status in real-time:', data);
  const index = remittances.value.findIndex(r => r.id === data.id);
  if (index !== -1) {
    remittances.value[index].status = data.status;
    remittances.value[index].updated_at = data.updated_at;
    lastChangedId.value = data.id;
    setTimeout(() => { lastChangedId.value = null; }, 1000);
  }
  loadStats();
};

// WebSocket Connection
const initSocket = () => {
  if (socketInitialized) return;
  socketInitialized = true;
  
  // Connect to socket
  const socketClient = connectSocket();
  
  // بعد از اتصال، به روم ادمین بپیوندید
  socketClient.on('connect', () => {
    console.log('🔌 Admin socket connected, joining admin room');
    joinAdminRoom();
  });
  
  // اگر از قبل متصل است
  if (socketClient.connected) {
    joinAdminRoom();
  }
  
  // Listen for new remittance
  onNewRemittance((data: any) => {
    console.log('📦 New remittance received by admin:', data);
    // بررسی نکنید که آیا قبلاً وجود دارد یا نه، اضافه کنید
    addNewRemittance(data);
  });
  
  // Listen for status updates
  onRemittanceStatusUpdate((data: any) => {
    console.log('📦 Status update received by admin:', data);
    updateRemittanceStatusRealtime(data);
  });
};

onMounted(() => {
  loadStats();
  loadRemittances();
  initSocket();
});

onUnmounted(() => {
  offNewRemittance();
  offRemittanceStatusUpdate();
});
</script>

<style scoped>
.admin-remittances-page {
  padding: 24px;
  background: #f5f6fa;
  min-height: 100vh;
}
.admin-remittances-page h1 {
  margin-bottom: 24px;
  color: #1a1a2e;
  font-size: 24px;
}
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.stat-icon { font-size: 32px; }
.stat-value { font-size: 28px; font-weight: bold; color: #333; }
.stat-label { font-size: 12px; color: #666; }
.stat-card.total .stat-value { color: #667eea; }
.stat-card.pending .stat-value { color: #f39c12; }
.stat-card.approved .stat-value { color: #27ae60; }
.stat-card.rejected .stat-value { color: #e74c3c; }
.stat-card.delivered .stat-value { color: #3498db; }
.stat-card.today .stat-value { color: #9b59b6; }
.stat-card.has-new { animation: pulse 1s ease-in-out; position: relative; }
.stat-card.has-new::after { content: '●'; position: absolute; top: 10px; right: 10px; color: #ff9800; font-size: 12px; animation: blink 1s infinite; }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
.filters-card, .table-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.filters-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.filter-group label { font-size: 12px; color: #666; font-weight: 500; }
.filter-select, .search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  min-width: 150px;
}
.search-input { min-width: 200px; }
.btn-refresh {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.table-header h2 { margin: 0; font-size: 18px; }
.total-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
}
.table-container { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px; text-align: center; border-bottom: 1px solid #f0f0f0; }
th { background: #f8f9fa; font-weight: 600; color: #555; }
.id-cell { font-weight: 600; color: #667eea; }
.user-cell .user-info { display: flex; flex-direction: column; }
.user-code { font-size: 11px; color: #999; }
.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
}
.type-weight { background: #e8f5e9; color: #27ae60; }
.type-rial { background: #e3f2fd; color: #1976d2; }
.type-coin { background: #fff8e1; color: #f39c12; }
.amount-cell { font-weight: 600; }
.status-select {
  padding: 4px 8px;
  border-radius: 20px;
  border: none;
  font-size: 12px;
  cursor: pointer;
}
.status-select.status-pending { background: #fff3e0; color: #f39c12; }
.status-select.status-approved { background: #e8f5e9; color: #27ae60; }
.status-select.status-rejected { background: #ffebee; color: #e74c3c; }
.status-select.status-delivered { background: #e3f2fd; color: #1976d2; }
.date-cell { font-size: 12px; direction: ltr; }
.actions { display: flex; gap: 8px; justify-content: center; }
.btn-detail, .btn-delete {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.btn-detail:hover { background: #e3f2fd; }
.btn-delete:hover { background: #ffebee; }
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
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
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 60px; }
.empty-icon { font-size: 48px; }
.new-row { animation: highlightNew 2s ease-in-out; background: linear-gradient(90deg, #e8f5e9, #ffffff); }
.status-changed { animation: statusFlash 0.5s ease-in-out; }
@keyframes highlightNew { 0% { background: #c8e6c9; } 100% { background: transparent; } }
@keyframes statusFlash { 0%, 100% { background: transparent; } 50% { background: #fff3e0; } }
.notification-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  border-right: 4px solid #ff9800;
  cursor: pointer;
  z-index: 1000;
  animation: bounceIn 0.5s ease;
}
@keyframes bounceIn {
  0% { transform: translateX(100px); opacity: 0; }
  60% { transform: translateX(-10px); }
  100% { transform: translateX(0); opacity: 1; }
}
.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}
.notification-icon { font-size: 28px; }
.notification-text strong { display: block; font-size: 14px; color: #333; }
.notification-text p { margin: 0; font-size: 12px; color: #666; }
.notification-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
  padding: 4px;
}
.notification-close:hover { color: #333; }
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-container {
  background: white;
  border-radius: 24px;
  width: 500px;
  max-width: 95%;
  max-height: 85vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px 24px 0 0;
}
.modal-header-content { display: flex; align-items: center; gap: 12px; }
.modal-icon {
  font-size: 28px;
  background: rgba(255,255,255,0.2);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.modal-header h3 { margin: 0; color: white; }
.close-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
.modal-body { padding: 24px; }
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}
.detail-item-full {
  grid-column: span 2;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}
.detail-item label { font-size: 11px; color: #666; }
.amount-highlight { color: #27ae60; font-weight: bold; font-size: 16px; }
.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}
.btn-close-modal {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
}
@media (max-width: 768px) {
  .admin-remittances-page { padding: 16px; }
  .stats-cards { grid-template-columns: repeat(2, 1fr); }
  .filters-row { flex-direction: column; }
  .filter-group { width: 100%; }
  .filter-select, .search-input { width: 100%; }
  .detail-grid { grid-template-columns: 1fr; }
  .detail-item-full { grid-column: span 1; }
}
</style>