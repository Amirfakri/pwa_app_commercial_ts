<template>
  <div class="riz-management-page">
    <h1>🏦 مدیریت ریز حساب مشتریان</h1>

    <!-- فیلترها و جستجو -->
    <div class="filters-card">
      <!-- ردیف اول: جستجو و دکمه‌ها -->
      <div class="filters-row">
        <div class="filter-group search-group">
          <label>🔍 جستجوی مشتری (کد، نام، شماره موبایل):</label>
          <div class="search-user-wrapper" ref="searchRef">
            <input 
              type="text" 
              v-model="userSearch" 
              placeholder=""
              @input="handleSearchChange"
              class="search-input"
            />
            <div v-if="showSearchResults" class="search-results">
              <div v-if="searchLoading" class="search-loading">
                <div class="small-spinner"></div>
                <span>در حال جستجو...</span>
              </div>
              <template v-else-if="searchResults.length > 0">
                <div 
                  v-for="user in searchResults" 
                  :key="user.user_code" 
                  @click="selectUser(user)"
                  class="search-result-item"
                >
                  <div class="user-info">
                    <span class="user-code">{{ user.user_code || 'بدون کد' }}</span>
                    <span class="user-name">{{ user.full_name || 'بدون نام' }}</span>
                  </div>
                  <span class="user-mobile">{{ user.mobile_number || 'بدون موبایل' }}</span>
                </div>
              </template>
              <div v-else class="no-results">
                {{ allUsersList.length ? 'هیچ کاربری یافت نشد' : 'لیست کاربران در دسترس نیست' }}
              </div>
            </div>
          </div>
        </div>

        <div class="filter-group actions-group">
          <button @click="loadCustomerSummary" class="btn-search" :disabled="loading">
            🔄 بارگذاری مجدد
          </button>
          <button @click="resetFilters" class="btn-reset">
            🧹 ریست
          </button>
        </div>
      </div>

      <!-- ردیف دوم: مشتری انتخاب شده -->
      <div class="selected-row" v-if="selectedUser">
        <div class="selected-user-card">
          <div class="selected-user-info">
            <span class="selected-label">مشتری انتخاب شده:</span>
            <span class="selected-code">{{ selectedUser.user_code }}</span>
            <span class="selected-name">{{ selectedUser.full_name }}</span>
            <span class="selected-mobile">{{ selectedUser.mobile_number }}</span>
          </div>
          <button @click="clearSelectedUser" class="clear-user-btn" title="حذف انتخاب">
            ✕
          </button>
        </div>
      </div>
      
      <!-- ردیف سوم: دکمه آپلود -->
      <div class="upload-row" v-if="selectedUser">
        <div class="upload-button-wrapper">
          <input
            type="file"
            accept=".json"
            @change="handleFileUpload"
            ref="fileInputRef"
            class="file-input"
            style="display: none"
          />
          <button 
            @click="$refs.fileInputRef.click()"
            class="btn-beautiful-upload"
            :disabled="uploading"
          >
            <div class="btn-icon">📤</div>
            <div class="btn-text">
              <span class="btn-title">{{ uploading ? '⏳ در حال آپلود...' : 'آپلود ریزحساب' }}</span>
              <span class="btn-subtitle">
                {{ selectedUser.full_name }} - {{ selectedUser.user_code }}
              </span>
            </div>
          </button>
          
          <!-- نمایش پیشرفت آپلود -->
          <div v-if="uploading && uploadProgress.percent > 0" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${uploadProgress.percent}%` }"></div>
            </div>
            <div class="progress-text">{{ uploadProgress.message }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- جدول خلاصه مشتریان -->
    <div class="summary-section">
      <div class="section-header">
        <h2>📊 خلاصه حساب مشتریان ({{ filteredCustomers.length }} مشتری)</h2>
        <div class="table-header-actions">
          <div class="table-search">
            <input
              type="text"
              v-model="tableSearchQuery"
              @input="filterCustomers"
              placeholder="جستجو در جدول (کد، نام مشتری)..."
              class="table-search-input"
            />
            <span class="search-icon">🔍</span>
          </div>
          <span class="total-badge">تعداد: {{ filteredCustomers.length }}</span>
        </div>
      </div>

      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>در حال بارگذاری داده‌ها...</p>
      </div>

      <div v-else class="table-container">
        <table dir="rtl">
          <thead>
            <tr>
              <th>کد مشتری</th>
              <th>نام مشتری</th>
              <th>شماره موبایل</th>
              <th>آخرین تراکنش</th>
              <th>شماره سند</th>
              <th>مانده طلایی</th>
              <th>مانده ریالی</th>
              <th>تعداد تراکنش‌ها</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in filteredCustomers" :key="customer.user_code">
              <td class="user-code">{{ customer.user_code || 'بدون کد' }}</td>
              <td class="user-name">{{ customer.full_name || 'بدون نام' }}</td>
              <td class="mobile-cell">{{ customer.mobile_number || '-' }}</td>
              <td class="date-cell">{{ formatDate(customer.last_transaction_date) }}</td>
              <td class="doc-number">{{ customer.last_document_no || '-' }}</td>
              <td class="balance-cell">
                <span 
                  :class="getBalanceClass(customer.final_weight_balance)"
                  class="balance-amount"
                >
                  {{ formatWeight(customer.final_weight_balance) }} گرم
                </span>
                <span class="balance-type">({{ getBalanceTypeText(customer.final_weight_balance) }})</span>
              </td>
              <td class="balance-cell">
                <span 
                  :class="getBalanceClass(customer.final_amount_balance)"
                  class="balance-amount"
                >
                  {{ formatRial(customer.final_amount_balance) }} ریال
                </span>
                <span class="balance-type">({{ getBalanceTypeText(customer.final_amount_balance) }})</span>
              </td>
              <td class="number-column">{{ formatNumber(customer.total_transactions) }}</td>
              <td class="actions">
                <button 
                  @click="viewUserTransactions(customer)" 
                  class="btn-view" 
                  title="مشاهده ریز تراکنش‌ها"
                  :disabled="customer.total_transactions === 0"
                >
                  📋 مشاهده تراکنش‌ها
                </button>
              </td>
             </tr>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="9" class="empty-state">
                <div class="empty-content">
                  <span class="empty-icon">📭</span>
                  <p>هیچ مشتری با مشخصات جستجو شده یافت نشد</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- مودال مشاهده تراکنش‌های کاربر -->
    <div v-if="showTransactionsModal && selectedUserForTransactions" class="modal-overlay" @click.self="closeTransactionsModal">
      <div class="modal-container transactions-modal">
        <div class="modal-header">
          <div class="modal-header-content">
            <div class="modal-icon">📋</div>
            <h3>
              ریز تراکنش‌های مشتری
              <span class="customer-name">{{ selectedUserForTransactions.full_name }}</span>
              <span class="customer-code">({{ selectedUserForTransactions.user_code }})</span>
            </h3>
          </div>
          <button @click="closeTransactionsModal" class="close-btn">✕</button>
        </div>
        
        <div class="modal-body">
          <!-- خلاصه اطلاعات مشتری -->
          <div class="customer-summary">
            <div class="summary-item">
              <span>📊 تعداد تراکنش‌ها:</span>
              <strong>{{ formatNumber(transactionPagination.total) }}</strong>
            </div>
            <div class="summary-item">
              <span>🥇 مانده طلایی:</span>
              <strong :class="getBalanceClass(selectedUserForTransactions.final_weight_balance)">
                {{ formatWeight(selectedUserForTransactions.final_weight_balance || 0) }} گرم
                <span class="balance-type">({{ getBalanceTypeText(selectedUserForTransactions.final_weight_balance || 0) }})</span>
              </strong>
            </div>
            <div class="summary-item">
              <span>💰 مانده ریالی:</span>
              <strong :class="getBalanceClass(selectedUserForTransactions.final_amount_balance || 0)">
                {{ formatRial(selectedUserForTransactions.final_amount_balance || 0) }} ریال
                <span class="balance-type">({{ getBalanceTypeText(selectedUserForTransactions.final_amount_balance || 0) }})</span>
              </strong>
            </div>
            <div class="summary-item">
              <button class="delete-all-button" @click="openDeleteAllDialog" title="حذف تمام تراکنش‌ها">
                🗑️ حذف تمام تراکنش‌ها
              </button>
            </div>
          </div>

          <!-- کنترل‌های Pagination -->
          <div class="pagination-controls">
            <div class="pagination-info">
              صفحه {{ transactionPagination.page }} از {{ totalPages || 1 }}
              ({{ formatNumber(transactionPagination.total) }} تراکنش)
            </div>
            <div class="pagination-buttons">
              <button 
                class="pagination-button"
                @click="goToFirstPage"
                :disabled="transactionPagination.page === 1 || transactionLoading"
                title="رفتن به صفحه اول"
              >
                ⏮️ صفحه اول
              </button>
              <button 
                class="pagination-button"
                @click="loadNextPage"
                :disabled="!transactionPagination.hasMore || transactionLoading"
                :title="transactionPagination.hasMore ? 'بارگذاری بیشتر' : 'تمام تراکنش‌ها بارگذاری شد'"
              >
                {{ transactionLoading ? '⏳' : 'بعدی ⏭️' }}
              </button>
            </div>
          </div>

          <!-- جدول تراکنش‌ها -->
          <div class="table-container" style="max-height: 55vh; overflow: auto;">
            <table dir="rtl">
              <thead>
                <tr>
                  <th>شماره سند</th>
                  <th>تاریخ</th>
                  <th>شرح</th>
                  <th class="number-column">عيار</th>
                  <th class="number-column">بدهکار طلا (گرم)</th>
                  <th class="number-column">بستانکار طلا (گرم)</th>
                  <th class="number-column">مانده طلا (گرم)</th>
                  <th class="number-column">بدهکار ریال</th>
                  <th class="number-column">بستانکار ریال</th>
                  <th class="number-column">مانده ریال</th>
                  <th class="number-column">اجرت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tx in userTransactions" :key="tx.id">
                  <td class="doc-number">{{ tx.document_no || '-' }}</td>
                  <td class="date-cell">{{ tx.date || '-' }}</td>
                  <td class="description-cell" :title="tx.description">{{ tx.description || '-' }}</td>
                  <td class="number-column">{{ formatNumber(tx.rate) }}</td>
                  <td class="number-column debit">{{ formatWeight(tx.weight_debit) }}</td>
                  <td class="number-column credit">{{ formatWeight(tx.weight_credit) }}</td>
                  <td :class="['number-column', getBalanceClass(tx.balance_weight)]">
                    {{ formatWeight(tx.balance_weight) }}
                  </td>
                  <td class="number-column debit">{{ formatRial(tx.debit_amount) }}</td>
                  <td class="number-column credit">{{ formatRial(tx.credit_amount) }}</td>
                  <td :class="['number-column', getBalanceClass(tx.balance_amount)]">
                    {{ formatRial(tx.balance_amount) }}
                  </td>
                  <td class="number-column">{{ formatRial(tx.wage) }}</td>
                  <td class="actions">
                    <button @click="viewTransactionDetails(tx)" class="btn-detail" title="مشاهده جزئیات">👁️</button>
                    <button @click="openDeleteTransactionDialog(tx)" class="btn-delete-transaction" title="حذف این رکورد">🗑️</button>
                  </td>
                </tr>
                <tr v-if="transactionLoading">
                  <td colspan="12" class="loading-more">
                    <div class="small-spinner"></div>
                    <span>در حال بارگذاری تراکنش‌های بیشتر...</span>
                  </td>
                </tr>
                <tr v-if="userTransactions.length === 0 && !transactionLoading">
                  <td colspan="12" class="empty-state">
                    <div class="empty-content">
                      <span class="empty-icon">📭</span>
                      <p>هیچ تراکنشی برای این مشتری یافت نشد</p>
                      <p class="empty-hint">برای افزودن تراکنش، یک فایل JSON آپلود کنید.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="!transactionPagination.hasMore && userTransactions.length > 0" class="end-of-list">
            ⚡ همه تراکنش‌ها نمایش داده شد ({{ formatNumber(transactionPagination.total) }} تراکنش)
          </div>

          <div class="modal-actions">
            <button @click="closeTransactionsModal" class="btn-close-modal">بستن</button>
          </div>
        </div>
      </div>
    </div>

    <!-- مودال جزئیات رکورد -->
    <div v-if="detailDialog.open" class="modal-overlay" @click.self="closeDetailDialog">
      <div class="modal-container detail-modal">
        <div class="modal-header">
          <div class="modal-header-content">
            <div class="modal-icon">📋</div>
            <h3>جزئیات کامل رکورد</h3>
          </div>
          <button @click="closeDetailDialog" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="detailDialog.record" class="detail-grid">
            <div class="detail-item">
              <label>🏷️ کد کاربر:</label>
              <span>{{ detailDialog.record.user_code || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>📄 شماره سند:</label>
              <span>{{ detailDialog.record.document_no || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>🧾 شماره فاکتور:</label>
              <span>{{ detailDialog.record.invoice_no || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>📅 تاریخ:</label>
              <span>{{ detailDialog.record.date || '-' }}</span>
            </div>
            <div class="detail-item-full">
              <label>📝 شرح:</label>
              <span class="description-text">{{ detailDialog.record.description || '-' }}</span>
            </div>
            
            <div class="detail-section">
              <h4>🥇 اطلاعات طلایی</h4>
              <div class="detail-row">
                <div class="detail-item">
                  <label>عيار:</label>
                  <span>{{ formatNumber(detailDialog.record.rate) }}</span>
                </div>
                <div class="detail-item">
                  <label>وزن بدهکار:</label>
                  <span class="debit">{{ formatWeight(detailDialog.record.weight_debit) }} گرم</span>
                </div>
                <div class="detail-item">
                  <label>وزن بستانکار:</label>
                  <span class="credit">{{ formatWeight(detailDialog.record.weight_credit) }} گرم</span>
                </div>
                <div class="detail-item">
                  <label>مانده وزن:</label>
                  <span :class="getBalanceClass(detailDialog.record.balance_weight)">
                    {{ formatWeight(detailDialog.record.balance_weight) }} گرم
                  </span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>💰 اطلاعات ریالی</h4>
              <div class="detail-row">
                <div class="detail-item">
                  <label>بدهی ریالی:</label>
                  <span class="debit">{{ formatRial(detailDialog.record.debit_amount) }} ریال</span>
                </div>
                <div class="detail-item">
                  <label>بستانکاری ریالی:</label>
                  <span class="credit">{{ formatRial(detailDialog.record.credit_amount) }} ریال</span>
                </div>
                <div class="detail-item">
                  <label>مانده ریالی:</label>
                  <span :class="getBalanceClass(detailDialog.record.balance_amount)">
                    {{ formatRial(detailDialog.record.balance_amount) }} ریال
                  </span>
                </div>
                <div class="detail-item">
                  <label>اجرت:</label>
                  <span>{{ formatRial(detailDialog.record.wage) }} ریال</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeDetailDialog" class="btn-close-modal">بستن</button>
        </div>
      </div>
    </div>

    <!-- مودال حذف تکی -->
    <div v-if="deleteDialog.open" class="modal-overlay" @click.self="closeDeleteDialog">
      <div class="modal-container confirm-modal">
        <div class="modal-header">
          <div class="modal-header-content">
            <div class="modal-icon">🗑️</div>
            <h3>تأیید حذف رکورد</h3>
          </div>
        </div>
        <div class="modal-body">
          <p>
            آیا از حذف رکورد با شماره سند <strong>"{{ deleteDialog.record?.document_no || 'بدون شماره' }}"</strong>
            برای کاربر <strong>"{{ deleteDialog.record?.user_code || 'بدون کد' }}"</strong> مطمئن هستید؟
          </p>
          <p class="warning-text">⚠️ این عمل غیرقابل بازگشت است!</p>
          <div class="modal-actions">
            <button @click="closeDeleteDialog" class="btn-cancel">انصراف</button>
            <button @click="confirmDeleteTransaction" class="btn-danger">🗑️ بله، حذف شود</button>
          </div>
        </div>
      </div>
    </div>

    <!-- مودال حذف همه تراکنش‌ها -->
    <div v-if="deleteAllDialog.open" class="modal-overlay" @click.self="closeDeleteAllDialog">
      <div class="modal-container confirm-modal">
        <div class="modal-header">
          <div class="modal-header-content">
            <div class="modal-icon">⚠️</div>
            <h3>تأیید حذف تمام تراکنش‌ها</h3>
          </div>
        </div>
        <div class="modal-body">
          <p>
            آیا از حذف تمام تراکنش‌های مشتری
            "<strong>{{ selectedUserForTransactions?.full_name || 'بدون نام' }}</strong>"
            (کد: <strong>{{ selectedUserForTransactions?.user_code }}</strong>) مطمئن هستید؟
          </p>
          <div class="warning-box">
            <p class="warning-text">⚠️ این عمل غیرقابل بازگشت است!</p>
            <p class="warning-details">
              تعداد تراکنش‌ها: <strong>{{ formatNumber(transactionPagination.total) }}</strong><br>
              مانده طلایی: <strong>{{ formatWeight(selectedUserForTransactions?.final_weight_balance || 0) }} گرم</strong><br>
              مانده ریالی: <strong>{{ formatRial(selectedUserForTransactions?.final_amount_balance || 0) }} ریال</strong>
            </p>
          </div>
          <div class="modal-actions">
            <button @click="closeDeleteAllDialog" class="btn-cancel">انصراف</button>
            <button @click="confirmDeleteAllTransactions" class="btn-danger">🗑️ بله، همه را حذف کن</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>در حال بارگذاری...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { api } from '@/core/http/axios';

// ==================== Types ====================
interface CustomerSummary {
  user_code: string;
  full_name: string;
  mobile_number: string;
  last_transaction_date: string;
  last_document_no: string;
  final_weight_balance: number;
  weight_type: string;
  final_amount_balance: number;
  amount_type: string;
  total_transactions: number;
  is_blocked: boolean;
}

interface Transaction {
  id: number;
  user_code: string;
  document_no: string;
  invoice_no: string | null;
  date: string | null;
  description: string | null;
  weight: number | null;
  weight_debit: number;
  weight_credit: number;
  rate: number | null;
  wage: number;
  balance_weight: number;
  debit_amount: number;
  credit_amount: number;
  balance_amount: number;
  created_at: string;
}

// ==================== State ====================
const customerSummaries = ref<CustomerSummary[]>([]);
const filteredCustomers = ref<CustomerSummary[]>([]);
const allUsersList = ref<CustomerSummary[]>([]);
const selectedUser = ref<CustomerSummary | null>(null);
const selectedUserForTransactions = ref<CustomerSummary | null>(null);
const userSearch = ref('');
const tableSearchQuery = ref('');
const searchResults = ref<CustomerSummary[]>([]);
const searchLoading = ref(false);
const showSearchResults = ref(false);
const userTransactions = ref<Transaction[]>([]);
const loading = ref(false);
const uploading = ref(false);
const uploadProgress = ref({ percent: 0, message: '' });
const showTransactionsModal = ref(false);
const fileInputRef = ref<HTMLInputElement>();
const searchRef = ref<HTMLElement>();

// Transaction pagination
const transactionPagination = ref({
  page: 1,
  limit: 50,
  total: 0,
  hasMore: false
});
const transactionLoading = ref(false);

// Dialogs
const deleteDialog = ref<{ open: boolean; record: Transaction | null }>({ open: false, record: null });
const deleteAllDialog = ref<{ open: boolean }>({ open: false });
const detailDialog = ref<{ open: boolean; record: Transaction | null }>({ open: false, record: null });

let searchTimeout: any = null;

// ==================== Computed ====================
const totalPages = computed(() => {
  return Math.ceil(transactionPagination.value.total / transactionPagination.value.limit);
});

// ==================== Helper Functions ====================
const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '۰';
  if (num === 0) return '۰';
  return num.toLocaleString('fa-IR');
};

const formatWeight = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '۰';
  if (num === 0) return '۰';
  return num.toLocaleString('fa-IR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
};

const formatRial = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '۰';
  if (num === 0) return '۰';
  return num.toLocaleString('fa-IR');
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('fa-IR');
    }
    return dateString;
  } catch {
    return dateString;
  }
};

// تعیین کلاس رنگ برای مانده حساب (آبی برای بستانکار، قرمز برای بدهکار)
const getBalanceClass = (balance: number): string => {
  if (balance > 0) return 'credit-positive';
  if (balance < 0) return 'debit-negative';
  return 'balance-zero';
};

// تعیین متن وضعیت
const getBalanceTypeText = (balance: number): string => {
  if (balance > 0) return 'بستانکار';
  if (balance < 0) return 'بدهکار';
  return 'صفر';
};

// ==================== API Functions ====================
const loadCustomerSummary = async () => {
  loading.value = true;
  try {
    const response = await api.get('/riz/customer-summary');
    if (response.data.success) {
      customerSummaries.value = response.data.data || [];
      allUsersList.value = response.data.data || [];
      filteredCustomers.value = response.data.data || [];
    }
  } catch (err: any) {
    console.error('Error loading customer summary:', err);
  } finally {
    loading.value = false;
  }
};

const fetchCustomerTransactions = async (userCode: string, page: number = 1, append: boolean = false) => {
  if (!userCode) return;
  
  transactionLoading.value = true;
  
  try {
    const limit = transactionPagination.value.limit;
    const response = await api.get(`/riz/customer-transactions/${userCode}`, {
      params: { page, limit }
    });
    
    if (response.data.success) {
      let newData = response.data.data || [];
      
      if (append) {
        const existingIds = new Set(userTransactions.value.map(item => item.id));
        const uniqueNewData = newData.filter((item: Transaction) => !existingIds.has(item.id));
        userTransactions.value = [...userTransactions.value, ...uniqueNewData];
      } else {
        userTransactions.value = newData;
      }
      
      const total = response.data.pagination?.total || newData.length;
      const hasMore = response.data.pagination?.hasMore || false;
      
      transactionPagination.value = {
        page: page,
        limit: limit,
        total: total,
        hasMore: hasMore
      };
    }
  } catch (err: any) {
    console.error('Error loading transactions:', err);
  } finally {
    transactionLoading.value = false;
  }
};

const loadNextPage = () => {
  if (transactionPagination.value.hasMore && !transactionLoading.value && selectedUserForTransactions.value) {
    fetchCustomerTransactions(
      selectedUserForTransactions.value.user_code,
      transactionPagination.value.page + 1,
      true
    );
  }
};

const goToFirstPage = () => {
  if (selectedUserForTransactions.value) {
    userTransactions.value = [];
    fetchCustomerTransactions(selectedUserForTransactions.value.user_code, 1, false);
  }
};

// Search Functions
const handleSearchChange = async () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const query = userSearch.value;
    if (!query || query.trim().length < 2) {
      searchResults.value = [];
      showSearchResults.value = false;
      return;
    }
    
    const filtered = allUsersList.value.filter((user: CustomerSummary) => {
      const userCode = user.user_code || '';
      const fullName = user.full_name || '';
      const mobile = user.mobile_number || '';
      const searchText = query.toLowerCase();
      
      return userCode.toLowerCase().includes(searchText) ||
             fullName.toLowerCase().includes(searchText) ||
             mobile.includes(query);
    }).slice(0, 10);
    
    searchResults.value = filtered;
    showSearchResults.value = true;
  }, 500);
};

const selectUser = (user: CustomerSummary) => {
  selectedUser.value = user;
  userSearch.value = `${user.user_code} - ${user.full_name}`;
  showSearchResults.value = false;
  searchResults.value = [];
};

const clearSelectedUser = () => {
  selectedUser.value = null;
  userSearch.value = '';
  searchResults.value = [];
  showSearchResults.value = false;
};

const filterCustomers = () => {
  const query = tableSearchQuery.value;
  if (!query.trim()) {
    filteredCustomers.value = customerSummaries.value;
    return;
  }
  
  const filtered = customerSummaries.value.filter((customer: CustomerSummary) =>
    (customer.user_code && customer.user_code.toLowerCase().includes(query.toLowerCase())) ||
    (customer.full_name && customer.full_name.toLowerCase().includes(query.toLowerCase())) ||
    (customer.mobile_number && customer.mobile_number.includes(query))
  );
  filteredCustomers.value = filtered;
};

const resetFilters = () => {
  selectedUser.value = null;
  userSearch.value = '';
  tableSearchQuery.value = '';
  loadCustomerSummary();
};

// View Transactions
const viewUserTransactions = async (customer: CustomerSummary) => {
  selectedUserForTransactions.value = customer;
  userTransactions.value = [];
  await fetchCustomerTransactions(customer.user_code, 1, false);
  showTransactionsModal.value = true;
};

const closeTransactionsModal = () => {
  showTransactionsModal.value = false;
  selectedUserForTransactions.value = null;
  userTransactions.value = [];
  transactionPagination.value = { page: 1, limit: 50, total: 0, hasMore: false };
};

// Transaction Details
const viewTransactionDetails = (record: Transaction) => {
  detailDialog.value = { open: true, record };
};

const closeDetailDialog = () => {
  detailDialog.value = { open: false, record: null };
};

// Delete single transaction
const openDeleteTransactionDialog = (record: Transaction) => {
  deleteDialog.value = { open: true, record };
};

const closeDeleteDialog = () => {
  deleteDialog.value = { open: false, record: null };
};

const confirmDeleteTransaction = async () => {
  const record = deleteDialog.value.record;
  if (!record) return;
  
  try {
    const response = await api.delete(`/riz/${record.id}`);
    if (response.data.success) {
      alert('رکورد با موفقیت حذف شد');
      closeDeleteDialog();
      if (selectedUserForTransactions.value) {
        await fetchCustomerTransactions(selectedUserForTransactions.value.user_code, 1, false);
        await loadCustomerSummary();
      }
    }
  } catch (err: any) {
    console.error('Error deleting record:', err);
    alert(err.response?.data?.message || 'خطا در حذف رکورد');
  }
};

// Delete all transactions
const openDeleteAllDialog = () => {
  deleteAllDialog.value = { open: true };
};

const closeDeleteAllDialog = () => {
  deleteAllDialog.value = { open: false };
};

const confirmDeleteAllTransactions = async () => {
  if (!selectedUserForTransactions.value) return;
  
  try {
    const response = await api.delete(`/riz/user/${selectedUserForTransactions.value.user_code}`);
    if (response.data.success) {
      alert('تمام تراکنش‌ها با موفقیت حذف شدند');
      closeDeleteAllDialog();
      closeTransactionsModal();
      await loadCustomerSummary();
    }
  } catch (err: any) {
    console.error('Error deleting all transactions:', err);
    alert(err.response?.data?.message || 'خطا در حذف تراکنش‌ها');
  }
};

// File Upload
const handleFileUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  
  if (!file.name.endsWith('.json')) {
    alert('لطفاً فقط فایل‌های JSON آپلود کنید');
    return;
  }
  
  if (!selectedUser.value) {
    alert('لطفاً یک مشتری را انتخاب کنید');
    return;
  }
  
  uploading.value = true;
  uploadProgress.value = { percent: 0, message: 'در حال خواندن فایل...' };
  
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        const jsonData = JSON.parse(content as string);
        
        if (!Array.isArray(jsonData)) {
          throw new Error('فایل باید شامل یک آرایه از رکوردها باشد');
        }
        
        uploadProgress.value = { percent: 30, message: 'در حال آپلود به سرور...' };
        
        const response = await api.post('/riz/upload', {
          rizData: jsonData,
          user_code: selectedUser.value!.user_code
        });
        
        uploadProgress.value = { percent: 100, message: 'آپلود با موفقیت انجام شد' };
        
        if (response.data.success) {
          alert(`✅ آپلود با موفقیت انجام شد\n${response.data.message || ''}`);
          await loadCustomerSummary();
        }
      } catch (err: any) {
        console.error('Error parsing file:', err);
        alert('خطا در پردازش فایل: ' + err.message);
      } finally {
        setTimeout(() => {
          uploading.value = false;
          uploadProgress.value = { percent: 0, message: '' };
          if (fileInputRef.value) fileInputRef.value.value = '';
        }, 2000);
      }
    };
    reader.readAsText(file, 'UTF-8');
  } catch (err: any) {
    console.error('Error uploading file:', err);
    alert('خطا در آپلود فایل: ' + err.message);
    uploading.value = false;
  }
};

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  if (searchRef.value && !searchRef.value.contains(event.target as Node)) {
    showSearchResults.value = false;
  }
};

onMounted(async () => {
  await loadCustomerSummary();
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>

<style scoped>
.riz-management-page {
  background: linear-gradient(135deg, #ffffff 0%, #ffffff 100%);
  min-height: 100vh;
  padding: 24px;
}

.riz-management-page h1 {
  margin: 0 0 24px;
  color: BLACK;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

/* ========== فیلتر کارت ========== */
.filters-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}

/* ردیف اول - جستجو و دکمه‌ها */
.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 24px;
}

.search-group {
  flex: 2;
  min-width: 300px;
}

.actions-group {
  flex: 0 0 auto;
  display: flex;
  gap: 12px;
}

.filter-group label {
  display: block;
  font-size: 13px;
  color: #555;
  margin-bottom: 8px;
  font-weight: 500;
}

.search-user-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 10px 6px;
  border: 2px solid #e1e5e9;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 12px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.search-result-item {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s ease;
}

.search-result-item:hover {
  background: #f8f9fa;
}

.user-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-code {
  font-weight: bold;
  color: #667eea;
}

.user-name {
  color: #333;
}

.user-mobile {
  color: #999;
  font-size: 12px;
}

.search-loading {
  padding: 20px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #999;
}

.btn-search, .btn-reset {
  padding: 12px 28px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-search {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-search:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102,126,234,0.4);
}

.btn-reset {
  background: #6c757d;
  color: white;
}

.btn-reset:hover {
  background: #5a6268;
  transform: translateY(-2px);
}

/* ردیف دوم - مشتری انتخاب شده */
.selected-row {
  margin-bottom: 24px;
  padding-top: 16px;
  border-top: 1px dashed #e1e5e9;
}

.selected-user-card {
  background: linear-gradient(135deg, #e8f0fe 0%, #d4e4fc 100%);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #667eea40;
}

.selected-user-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.selected-label {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
}

.selected-code {
  font-size: 16px;
  font-weight: bold;
  color: #667eea;
  background: white;
  padding: 4px 12px;
  border-radius: 20px;
}

.selected-name {
  font-size: 15px;
  font-weight: 500;
  color: #2d3748;
}

.selected-mobile {
  font-size: 13px;
  color: #718096;
  direction: ltr;
}

.clear-user-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #e74c3c;
  font-size: 20px;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-user-btn:hover {
  background: rgba(231, 76, 60, 0.1);
  transform: scale(1.1);
}

/* ردیف سوم - آپلود */
.upload-row {
  padding-top: 8px;
}

.upload-button-wrapper {
  width: 100%;
}

.btn-beautiful-upload {
  width: 100%;
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  border: none;
  border-radius: 16px;
  padding: 16px 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(39,174,96,0.3);
}

.btn-beautiful-upload:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(39,174,96,0.4);
}

.btn-beautiful-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 36px;
  background: rgba(255,255,255,0.2);
  width: 65px;
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.btn-text {
  flex: 1;
  text-align: right;
}

.btn-title {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: white;
  margin-bottom: 6px;
}

.btn-subtitle {
  display: block;
  font-size: 13px;
  color: rgba(255,255,255,0.9);
}

.upload-progress {
  margin-top: 12px;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.progress-text {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

/* ========== بخش خلاصه ========== */
.summary-section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.table-header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.table-search {
  position: relative;
}

.table-search-input {
  padding: 8px 12px;
  padding-right: 32px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  width: 250px;
}

.search-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #999;
}

.total-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

/* ========== جدول ========== */
.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th, td {
  padding: 14px 12px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
  position: sticky;
  top: 0;
  z-index: 10;
}

.user-code {
  font-weight: 600;
  color: #667eea;
}

.user-name {
  font-weight: 500;
}

.mobile-cell {
  direction: ltr;
  font-size: 12px;
}

.date-cell {
  font-size: 12px;
  direction: ltr;
}

.doc-number {
  font-weight: 600;
  color: #3498db;
}

.number-column {
  text-align: left;
  font-family: monospace;
}

/* رنگ‌بندی مانده حساب - آبی برای بستانکار، قرمز برای بدهکار */
.credit-positive {
  color: #0066cc;
  font-weight: bold;
}

.debit-negative {
  color: #e74c3c;
  font-weight: bold;
}

.balance-zero {
  color: #95a5a6;
}

.balance-cell {
  text-align: center;
}

.balance-amount {
  font-size: 13px;
  font-weight: 600;
}

.balance-type {
  font-size: 11px;
  opacity: 0.7;
  margin-right: 4px;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-view, .btn-detail, .btn-delete-transaction {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-view {
  background: #3498db;
  color: white;
}

.btn-view:hover:not(:disabled) {
  background: #2980b9;
  transform: scale(1.05);
}

.btn-view:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-detail {
  background: #8b5cf6;
  color: white;
}

.btn-detail:hover {
  background: #7c3aed;
  transform: scale(1.05);
}

.btn-delete-transaction {
  background: #ef4444;
  color: white;
}

.btn-delete-transaction:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.delete-all-button {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.delete-all-button:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* Loading States */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.spinner, .loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.small-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f4f6;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-more {
  text-align: center;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.empty-icon {
  font-size: 48px;
}

.empty-hint {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.end-of-list {
  text-align: center;
  padding: 16px;
  color: #10b981;
  font-size: 13px;
  background: #f0fdf4;
  border-radius: 8px;
  margin-top: 16px;
}

/* ========== Modal Styles ========== */
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
  width: 1400px;
  max-width: 95%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0,0,0,0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px 24px 0 0;
  position: sticky;
  top: 0;
  z-index: 20;
}

.modal-header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

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

.modal-header h3 {
  margin: 0;
  color: white;
  font-size: 18px;
}

.customer-name {
  font-weight: bold;
}

.customer-code {
  font-size: 14px;
  opacity: 0.9;
  margin-right: 8px;
}

.close-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255,255,255,0.3);
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px;
}

.customer-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 16px;
}

.summary-item {
  flex: 1;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.summary-item span:first-child {
  font-size: 13px;
  color: #666;
}

.summary-item strong {
  font-size: 16px;
}

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
}

.pagination-info {
  font-size: 13px;
  color: #666;
}

.pagination-buttons {
  display: flex;
  gap: 12px;
}

.pagination-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.pagination-button:hover:not(:disabled) {
  transform: scale(1.05);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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

.detail-item label, .detail-item-full label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.detail-item span, .detail-item-full span {
  font-size: 14px;
  font-weight: 500;
}

.description-text {
  word-break: break-word;
  white-space: pre-wrap;
}

.detail-section {
  grid-column: span 2;
  margin-top: 8px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.detail-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-close-modal, .btn-cancel {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-close-modal:hover, .btn-cancel:hover {
  background: #7f8c8d;
  transform: translateY(-1px);
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-danger:hover {
  background: #c0392b;
  transform: translateY(-1px);
}

.warning-text {
  color: #e74c3c;
  font-size: 13px;
  margin-top: 12px;
  padding: 8px;
  background: #fee;
  border-radius: 8px;
  text-align: center;
}

.warning-box {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
}

.warning-details {
  font-size: 13px;
  margin-top: 8px;
  color: #92400e;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 2000;
}

.loading-overlay p {
  color: white;
  margin-top: 16px;
  font-size: 14px;
}

.description-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Responsive */
@media (max-width: 768px) {
  .riz-management-page {
    padding: 16px;
  }
  
  .filters-row {
    flex-direction: column;
  }
  
  .search-group {
    min-width: 100%;
  }
  
  .actions-group {
    width: 100%;
  }
  
  .btn-search, .btn-reset {
    flex: 1;
  }
  
  .selected-user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .table-header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .table-search-input {
    width: 100%;
  }
  
  .customer-summary {
    flex-direction: column;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-item-full {
    grid-column: span 1;
  }
  
  .detail-row {
    grid-template-columns: 1fr;
  }
  
  th, td {
    padding: 8px 6px;
    font-size: 11px;
  }
  
  .modal-container {
    width: 98%;
  }
}
</style>