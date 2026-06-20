<template>
  <div class="products-page">
    <h1>مدیریت محصولات</h1>

    <!-- تب‌ها -->
    <div class="tabs">
      <button 
        :class="{ active: activeTab === 'melted' }" 
        @click="activeTab = 'melted'; loadMeltedProducts()"
        class="tab-btn"
      >
        محصولات آبشده (طلا)
      </button>
      <button 
        :class="{ active: activeTab === 'coins' }" 
        @click="activeTab = 'coins'; loadCoinProducts()"
        class="tab-btn"
      >
        سکه‌ها
      </button>
    </div>

    <!-- محصولات آبشده -->
    <div v-if="activeTab === 'melted'" class="products-section">
      <div class="toolbar">
        <button @click="showCreateMeltedModal = true" class="btn-create">+ محصول جدید</button>
        <input
          type="text"
          v-model="meltedSearch"
          placeholder="جستجوی محصول..."
          @input="loadMeltedProducts"
          class="search-input"
        />
      </div>

      <div class="table-container">
        <table dir="rtl">
          <thead>
            <tr>
              <th>کد محصول</th>
              <th>نام محصول</th>
              <th>نام نمایشی</th>
              <th>حداقل وزن (گرم)</th>
              <th>حداکثر وزن (گرم)</th>
              <th>ترتیب نمایش</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in meltedProducts" :key="product.id">
              <td>{{ product.code }}</td>
              <td>{{ product.name }}</td>
              <td>{{ product.default_display_name || '-' }}</td>
              <td>{{ product.min_weight }}</td>
              <td>{{ product.max_weight }}</td>
              <td>{{ product.display_order }}</td>
              <td>
                <span :class="product.is_active ? 'active' : 'inactive'">
                  {{ product.is_active ? 'فعال' : 'غیرفعال' }}
                </span>
              </td>
              <td class="actions">
                <button @click="editMeltedProduct(product)" class="btn-edit" title="ویرایش">✏️</button>
                <button @click="toggleMeltedProductStatus(product)" class="btn-toggle" :title="product.is_active ? 'غیرفعال کردن' : 'فعال کردن'">
                  {{ product.is_active ? '🔴' : '🟢' }}
                </button>
                <button @click="deleteMeltedProduct(product)" class="btn-delete" title="حذف">🗑️</button>
              </td>
            </tr>
            <tr v-if="meltedProducts.length === 0">
              <td colspan="8" class="empty">هیچ محصولی یافت نشد</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- سکه‌ها -->
    <div v-if="activeTab === 'coins'" class="products-section">
      <div class="toolbar">
        <button @click="showCreateCoinModal = true" class="btn-create">+ سکه جدید</button>
        <input
          type="text"
          v-model="coinSearch"
          placeholder="جستجوی سکه..."
          @input="loadCoinProducts"
          class="search-input"
        />
      </div>

      <div class="table-container">
        <table dir="rtl">
          <thead>
            <tr>
              <th>کد سکه</th>
              <th>نام سکه</th>
              <th>حداقل تعداد</th>
              <th>حداکثر تعداد</th>
              <th>ترتیب نمایش</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in coinProducts" :key="product.id">
              <td>{{ product.code }}</td>
              <td>{{ product.name }}</td>
              <td>{{ product.min_count }}</td>
              <td>{{ product.max_count }}</td>
              <td>{{ product.display_order }}</td>
              <td>
                <span :class="product.is_active ? 'active' : 'inactive'">
                  {{ product.is_active ? 'فعال' : 'غیرفعال' }}
                </span>
              </td>
              <td class="actions">
                <button @click="editCoinProduct(product)" class="btn-edit" title="ویرایش">✏️</button>
                <button @click="toggleCoinProductStatus(product)" class="btn-toggle" :title="product.is_active ? 'غیرفعال کردن' : 'فعال کردن'">
                  {{ product.is_active ? '🔴' : '🟢' }}
                </button>
                <button @click="deleteCoinProduct(product)" class="btn-delete" title="حذف">🗑️</button>
              </td>
            </tr>
            <tr v-if="coinProducts.length === 0">
              <td colspan="7" class="empty">هیچ سکه‌ای یافت نشد</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- مودال ایجاد/ویرایش محصول آبشده -->
    <div v-if="showCreateMeltedModal || showEditMeltedModal" class="modal">
      <div class="modal-content">
        <h3>{{ showEditMeltedModal ? 'ویرایش محصول' : 'محصول جدید' }}</h3>
        <form @submit.prevent="saveMeltedProduct">
          <div class="form-group">
            <label>کد محصول *</label>
            <input type="text" v-model="meltedForm.code" required :readonly="showEditMeltedModal" />
            <small v-if="!showEditMeltedModal" class="hint">مثال: AB_FARDA, AB_PASFARDA</small>
          </div>
          <div class="form-group">
            <label>نام محصول *</label>
            <input type="text" v-model="meltedForm.name" required />
          </div>
          <div class="form-group">
            <label>نام نمایشی (برای قیمت)</label>
            <input type="text" v-model="meltedForm.default_display_name" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>حداقل وزن (گرم)</label>
              <input type="number" step="0.001" v-model.number="meltedForm.min_weight" />
            </div>
            <div class="form-group">
              <label>حداکثر وزن (گرم)</label>
              <input type="number" step="0.001" v-model.number="meltedForm.max_weight" />
            </div>
          </div>
          <div class="form-group">
            <label>ترتیب نمایش</label>
            <input type="number" v-model.number="meltedForm.display_order" />
          </div>
          <div class="form-group">
            <label>وضعیت</label>
            <select v-model="meltedForm.is_active">
              <option :value="true">فعال</option>
              <option :value="false">غیرفعال</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="submit" :disabled="loading" class="btn-save">
              {{ loading ? 'در حال ذخیره...' : 'ذخیره' }}
            </button>
            <button type="button" @click="closeMeltedModal" class="btn-cancel">انصراف</button>
          </div>
        </form>
      </div>
    </div>

    <!-- مودال ایجاد/ویرایش سکه -->
    <div v-if="showCreateCoinModal || showEditCoinModal" class="modal">
      <div class="modal-content">
        <h3>{{ showEditCoinModal ? 'ویرایش سکه' : 'سکه جدید' }}</h3>
        <form @submit.prevent="saveCoinProduct">
          <div class="form-group">
            <label>کد سکه *</label>
            <input type="text" v-model="coinForm.code" required :readonly="showEditCoinModal" />
            <small v-if="!showEditCoinModal" class="hint">مثال: COIN_1, COIN_2, COIN_3</small>
          </div>
          <div class="form-group">
            <label>نام سکه *</label>
            <input type="text" v-model="coinForm.name" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>حداقل تعداد</label>
              <input type="number" v-model.number="coinForm.min_count" />
            </div>
            <div class="form-group">
              <label>حداکثر تعداد</label>
              <input type="number" v-model.number="coinForm.max_count" />
            </div>
          </div>
          <div class="form-group">
            <label>ترتیب نمایش</label>
            <input type="number" v-model.number="coinForm.display_order" />
          </div>
          <div class="form-group">
            <label>وضعیت</label>
            <select v-model="coinForm.is_active">
              <option :value="true">فعال</option>
              <option :value="false">غیرفعال</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="submit" :disabled="loading" class="btn-save">
              {{ loading ? 'در حال ذخیره...' : 'ذخیره' }}
            </button>
            <button type="button" @click="closeCoinModal" class="btn-cancel">انصراف</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { api } from '@/core/http/axios';
import { connectSocket, emitEvent, offAllEvents } from '@/core/socket/socket.io';

const activeTab = ref<'melted' | 'coins'>('melted');

// محصولات آبشده
const meltedProducts = ref<any[]>([]);
const meltedSearch = ref('');
const showCreateMeltedModal = ref(false);
const showEditMeltedModal = ref(false);
const meltedForm = ref({
  id: 0,
  code: '',
  name: '',
  default_display_name: '',
  min_weight: 0.001,
  max_weight: 100,
  display_order: 0,
  is_active: true
});

// سکه‌ها
const coinProducts = ref<any[]>([]);
const coinSearch = ref('');
const showCreateCoinModal = ref(false);
const showEditCoinModal = ref(false);
const coinForm = ref({
  id: 0,
  code: '',
  name: '',
  min_count: 1,
  max_count: 50,
  display_order: 0,
  is_active: true
});

const loading = ref(false);
let socket: any = null;

// ==================== Socket.IO ====================
const initSocket = () => {
  socket = connectSocket();
  
  socket.on('products_full_update', (data: any) => {
    console.log('📦 Products full update received in admin:', data);
    if (data.success && data.data) {
      if (activeTab.value === 'melted') {
        meltedProducts.value = data.data.melted || [];
      } else {
        coinProducts.value = data.data.coins || [];
      }
    }
  });
};

// ==================== محصولات آبشده ====================
const loadMeltedProducts = async () => {
  try {
    let url = '/admin/melted-products';
    if (meltedSearch.value) {
      url += `?search=${meltedSearch.value}`;
    }
    console.log('📤 Loading melted products from:', url);
    const response = await api.get(url);
    console.log('📥 Melted products response:', response.data);
    if (response.data.success) {
      meltedProducts.value = response.data.data || [];
      console.log('✅ Melted products loaded:', meltedProducts.value.length);
    }
  } catch (err) {
    console.error('Error loading melted products:', err);
  }
};

const saveMeltedProduct = async () => {
  if (!meltedForm.value.code || !meltedForm.value.name) {
    alert('کد و نام محصول الزامی است');
    return;
  }

  loading.value = true;
  try {
    let response;
    if (showEditMeltedModal.value) {
      response = await api.put(`/admin/melted-products/${meltedForm.value.id}`, meltedForm.value);
    } else {
      response = await api.post('/admin/melted-products', meltedForm.value);
    }
    
    if (response.data.success) {
      await loadMeltedProducts();
      closeMeltedModal();
      emitEvent('products_full_update_request', {});
      alert(showEditMeltedModal.value ? 'محصول با موفقیت ویرایش شد' : 'محصول با موفقیت ایجاد شد');
    }
  } catch (err: any) {
    console.error('Error saving melted product:', err);
    alert(err.response?.data?.error || 'خطا در ذخیره محصول');
  } finally {
    loading.value = false;
  }
};

const editMeltedProduct = (product: any) => {
  meltedForm.value = { ...product };
  showEditMeltedModal.value = true;
  showCreateMeltedModal.value = false;
};

const toggleMeltedProductStatus = async (product: any) => {
  try {
    const response = await api.put(`/admin/melted-products/${product.id}`, { is_active: !product.is_active });
    if (response.data.success) {
      await loadMeltedProducts();
      emitEvent('product_status_update', {
        product_code: product.code,
        is_active: !product.is_active,
        timestamp: new Date().toISOString()
      });
      emitEvent('products_full_update_request', {});
    }
  } catch (err) {
    console.error('Error toggling product status:', err);
    alert('خطا در تغییر وضعیت محصول');
  }
};

const deleteMeltedProduct = async (product: any) => {
  if (confirm(`آیا از حذف محصول "${product.name}" اطمینان دارید؟`)) {
    try {
      await api.delete(`/admin/melted-products/${product.id}`);
      await loadMeltedProducts();
      emitEvent('product_deleted', {
        product_code: product.code,
        timestamp: new Date().toISOString()
      });
      emitEvent('products_full_update_request', {});
      alert('محصول با موفقیت حذف شد');
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('خطا در حذف محصول');
    }
  }
};

const closeMeltedModal = () => {
  showCreateMeltedModal.value = false;
  showEditMeltedModal.value = false;
  meltedForm.value = {
    id: 0,
    code: '',
    name: '',
    default_display_name: '',
    min_weight: 0.001,
    max_weight: 100,
    display_order: 0,
    is_active: true
  };
};

// ==================== سکه‌ها ====================
const loadCoinProducts = async () => {
  try {
    let url = '/admin/coins';
    if (coinSearch.value) {
      url += `?search=${coinSearch.value}`;
    }
    console.log('📤 Loading coin products from:', url);
    const response = await api.get(url);
    console.log('📥 Coin products response:', response.data);
    if (response.data.success) {
      coinProducts.value = response.data.data || [];
      console.log('✅ Coin products loaded:', coinProducts.value.length);
    }
  } catch (err) {
    console.error('Error loading coin products:', err);
  }
};

const saveCoinProduct = async () => {
  if (!coinForm.value.code || !coinForm.value.name) {
    alert('کد و نام سکه الزامی است');
    return;
  }

  loading.value = true;
  try {
    let response;
    if (showEditCoinModal.value) {
      response = await api.put(`/admin/coins/${coinForm.value.id}`, coinForm.value);
    } else {
      response = await api.post('/admin/coins', coinForm.value);
    }
    
    if (response.data.success) {
      await loadCoinProducts();
      closeCoinModal();
      emitEvent('products_full_update_request', {});
      alert(showEditCoinModal.value ? 'سکه با موفقیت ویرایش شد' : 'سکه با موفقیت ایجاد شد');
    }
  } catch (err: any) {
    console.error('Error saving coin product:', err);
    alert(err.response?.data?.error || 'خطا در ذخیره سکه');
  } finally {
    loading.value = false;
  }
};

const editCoinProduct = (product: any) => {
  coinForm.value = { ...product };
  showEditCoinModal.value = true;
  showCreateCoinModal.value = false;
};

const toggleCoinProductStatus = async (product: any) => {
  try {
    const response = await api.put(`/admin/coins/${product.id}`, { is_active: !product.is_active });
    if (response.data.success) {
      await loadCoinProducts();
      emitEvent('product_status_update', {
        product_code: product.code,
        is_active: !product.is_active,
        timestamp: new Date().toISOString()
      });
      emitEvent('products_full_update_request', {});
    }
  } catch (err) {
    console.error('Error toggling coin status:', err);
    alert('خطا در تغییر وضعیت سکه');
  }
};

const deleteCoinProduct = async (product: any) => {
  if (confirm(`آیا از حذف سکه "${product.name}" اطمینان دارید؟`)) {
    try {
      await api.delete(`/admin/coins/${product.id}`);
      await loadCoinProducts();
      emitEvent('product_deleted', {
        product_code: product.code,
        timestamp: new Date().toISOString()
      });
      emitEvent('products_full_update_request', {});
      alert('سکه با موفقیت حذف شد');
    } catch (err) {
      console.error('Error deleting coin:', err);
      alert('خطا در حذف سکه');
    }
  }
};

const closeCoinModal = () => {
  showCreateCoinModal.value = false;
  showEditCoinModal.value = false;
  coinForm.value = {
    id: 0,
    code: '',
    name: '',
    min_count: 1,
    max_count: 50,
    display_order: 0,
    is_active: true
  };
};

onMounted(() => {
  loadMeltedProducts();
  loadCoinProducts();
  initSocket();
});

onUnmounted(() => {
  if (socket) {
    offAllEvents();
    socket.disconnect();
  }
});
</script>

<style scoped>
.products-page {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.products-page h1 {
  margin: 0 0 20px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.tab-btn {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: all 0.3s;
}

.tab-btn.active {
  color: #667eea;
  border-bottom: 2px solid #667eea;
}

.tab-btn:hover {
  color: #667eea;
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

.active {
  color: #27ae60;
}

.inactive {
  color: #e74c3c;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-edit, .btn-toggle, .btn-delete {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-edit:hover { background: #3498db; color: white; }
.btn-toggle:hover { background: #f39c12; color: white; }
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
}

.modal-content h3 {
  margin: 0 0 20px;
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

.hint {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  display: block;
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

.btn-cancel {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>