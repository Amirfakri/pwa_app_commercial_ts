<!-- frontend/src/modules/admin/views/AdminTermsView.vue -->
<template>
  <div class="admin-terms-page">
    <h1>📜 مدیریت شرایط و قوانین</h1>
    
    <div class="terms-card">
      <div class="card-header">
        <span class="card-icon">📝</span>
        <h2>ایجاد نسخه جدید</h2>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label>متن شرایط و قوانین</label>
          <textarea 
            v-model="newTerms.content" 
            rows="12" 
            class="form-textarea"
            placeholder="متن شرایط و قوانین را وارد کنید..."
          ></textarea>
          <small class="hint">از HTML ساده مانند &lt;br&gt; و &lt;strong&gt; می‌توانید استفاده کنید</small>
        </div>
        <button @click="createTerms" :disabled="creating || !newTerms.content.trim()" class="btn-primary">
          {{ creating ? 'در حال ایجاد...' : 'ایجاد نسخه جدید' }}
        </button>
      </div>
    </div>
    
    <div class="history-card">
      <div class="card-header">
        <span class="card-icon">📜</span>
        <h2>تاریخچه نسخه‌ها</h2>
      </div>
      <div class="card-body">
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>در حال بارگذاری...</p>
        </div>
        
        <div v-else-if="history.length === 0" class="empty-state">
          <span class="empty-icon">📭</span>
          <p>هیچ نسخه‌ای یافت نشد</p>
        </div>
        
        <div v-else class="history-list">
          <div v-for="item in history" :key="item.id" class="history-item" :class="{ active: item.is_active }">
            <div class="history-header">
              <div class="version-info">
                <span class="version-badge" :class="{ active: item.is_active }">
                  {{ item.is_active ? 'نسخه فعال' : 'نسخه غیرفعال' }}
                </span>
                <span class="version-number">نسخه {{ item.version }}</span>
              </div>
              <div class="version-date">
                {{ formatDate(item.created_at) }}
              </div>
            </div>
            <div class="history-content">
              <div class="content-preview">{{ truncateText(item.content, 200) }}</div>
              <button @click="viewDetails(item)" class="btn-view">مشاهده کامل</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- مودال مشاهده جزئیات -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
      <div class="modal-container detail-modal">
        <div class="modal-header">
          <div class="modal-header-content">
            <span class="modal-icon">📜</span>
            <h3>جزئیات نسخه {{ selectedVersion?.version }}</h3>
          </div>
          <button @click="closeDetailModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-info">
            <div class="detail-row">
              <span class="label">وضعیت:</span>
              <span :class="['status-badge', selectedVersion?.is_active ? 'active' : 'inactive']">
                {{ selectedVersion?.is_active ? 'فعال' : 'غیرفعال' }}
              </span>
            </div>
            <div class="detail-row">
              <span class="label">تاریخ ایجاد:</span>
              <span>{{ formatDateFull(selectedVersion?.created_at) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">ایجاد کننده:</span>
              <span>{{ selectedVersion?.created_by_name || 'سیستم' }}</span>
            </div>
          </div>
          <div class="detail-content">
            <label>متن کامل:</label>
            <div class="content-box" v-html="selectedVersion?.content.replace(/\n/g, '<br>')"></div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeDetailModal" class="btn-close-modal">بستن</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/core/http/axios';

interface TermsHistory {
  id: number;
  content: string;
  version: string;
  is_active: boolean;
  created_at: string;
  created_by_name: string;
}

const history = ref<TermsHistory[]>([]);
const loading = ref(false);
const creating = ref(false);
const newTerms = ref({ content: '' });
const showDetailModal = ref(false);
const selectedVersion = ref<TermsHistory | null>(null);

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const formatDate = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fa-IR');
};

const formatDateFull = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fa-IR') + ' ' + d.toLocaleTimeString('fa-IR');
};

const loadHistory = async () => {
  loading.value = true;
  try {
    const response = await api.get('/support/terms/history');
    if (response.data.success) {
      history.value = response.data.data;
    }
  } catch (err) {
    console.error('Error loading terms history:', err);
  } finally {
    loading.value = false;
  }
};

const createTerms = async () => {
  if (!newTerms.value.content.trim()) return;
  
  creating.value = true;
  try {
    const response = await api.post('/support/terms', {
      content: newTerms.value.content
    });
    if (response.data.success) {
      newTerms.value.content = '';
      await loadHistory();
      alert('نسخه جدید با موفقیت ایجاد شد');
    }
  } catch (err: any) {
    console.error('Error creating terms:', err);
    alert(err.response?.data?.error || 'خطا در ایجاد نسخه جدید');
  } finally {
    creating.value = false;
  }
};

const viewDetails = (item: TermsHistory) => {
  selectedVersion.value = item;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedVersion.value = null;
};

onMounted(() => {
  loadHistory();
});
</script>

<style scoped>
.admin-terms-page {
  padding: 24px;
  background: #f5f6fa;
  min-height: 100vh;
}
.admin-terms-page h1 {
  margin-bottom: 24px;
  color: #1a1a2e;
}
.terms-card, .history-card {
  background: white;
  border-radius: 16px;
  margin-bottom: 24px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.card-icon {
  font-size: 24px;
}
.card-header h2 {
  margin: 0;
  font-size: 18px;
}
.card-body {
  padding: 20px;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}
.hint {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: #999;
}
.btn-primary {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.history-item {
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;
}
.history-item.active {
  border-color: #27ae60;
  background: #f0fdf4;
}
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
}
.version-info {
  display: flex;
  gap: 12px;
  align-items: center;
}
.version-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  background: #e2e3e5;
  color: #383d41;
}
.version-badge.active {
  background: #27ae60;
  color: white;
}
.version-number {
  font-weight: 600;
  color: #333;
}
.version-date {
  font-size: 12px;
  color: #999;
}
.history-content {
  padding: 16px;
}
.content-preview {
  font-size: 13px;
  line-height: 1.6;
  color: #666;
  margin-bottom: 12px;
}
.btn-view {
  background: #667eea;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
.loading-container {
  text-align: center;
  padding: 40px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.empty-state {
  text-align: center;
  padding: 40px;
}
.empty-icon {
  font-size: 48px;
}
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
  width: 700px;
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
.modal-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}
.modal-icon {
  font-size: 28px;
  background: rgba(255,255,255,0.2);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.modal-header h3 {
  margin: 0;
  color: white;
}
.close-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
}
.modal-body {
  padding: 24px;
}
.detail-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}
.detail-row {
  display: flex;
  margin-bottom: 8px;
}
.detail-row .label {
  width: 100px;
  font-weight: 500;
  color: #666;
}
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}
.status-badge.active {
  background: #27ae60;
  color: white;
}
.status-badge.inactive {
  background: #e74c3c;
  color: white;
}
.detail-content label {
  display: block;
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}
.content-box {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  line-height: 1.8;
  font-size: 14px;
  max-height: 400px;
  overflow-y: auto;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #eee;
}
.btn-close-modal {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
}
</style>