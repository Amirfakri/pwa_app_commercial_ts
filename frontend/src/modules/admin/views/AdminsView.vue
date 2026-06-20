<template>
  <div class="admins-page">
    <h1>مدیریت ادمین‌ها</h1>
    
    <div class="toolbar">
      <button @click="showCreateModal = true" class="btn-create">+ ادمین جدید</button>
    </div>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>نام و نام خانوادگی</th>
            <th>شماره موبایل</th>
            <th>نوع</th>
            <th>وضعیت</th>
            <th>تاریخ ثبت</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="admin in admins" :key="admin.id">
            <td>{{ admin.first_name }} {{ admin.last_name }}</td>
            <td>{{ admin.mobile_number }}</td>
            <td>
              <span v-if="admin.is_main_admin" class="badge-main">ادمین اصلی</span>
              <span v-else class="badge-normal">ادمین عادی</span>
            </td>
            <td>
              <span :class="admin.is_active ? 'active' : 'inactive'">
                {{ admin.is_active ? 'فعال' : 'غیرفعال' }}
              </span>
            </td>
            <td>{{ formatDate(admin.created_at) }}</td>
            <td class="actions">
              <button 
                v-if="!admin.is_main_admin" 
                @click="toggleStatus(admin)" 
                class="btn-toggle"
              >
                {{ admin.is_active ? 'غیرفعال کردن' : 'فعال کردن' }}
              </button>
              <button 
                v-if="!admin.is_main_admin" 
                @click="deleteAdmin(admin.id)" 
                class="btn-delete"
              >
                حذف
              </button>
              <span v-if="admin.is_main_admin" class="no-action">غیرقابل تغییر</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- مودال ایجاد ادمین -->
    <div v-if="showCreateModal" class="modal">
      <div class="modal-content">
        <h3>افزودن ادمین جدید</h3>
        <form @submit.prevent="createAdmin">
          <div class="form-group">
            <label>نام</label>
            <input type="text" v-model="newAdmin.first_name" required />
          </div>
          <div class="form-group">
            <label>نام خانوادگی</label>
            <input type="text" v-model="newAdmin.last_name" required />
          </div>
          <div class="form-group">
            <label>شماره موبایل</label>
            <input type="tel" v-model="newAdmin.mobile_number" required />
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
import { ref, onMounted } from 'vue';
import { api } from '@/core/http/axios';

const admins = ref<any[]>([]);
const showCreateModal = ref(false);
const loading = ref(false);
const newAdmin = ref({
  first_name: '',
  last_name: '',
  mobile_number: ''
});

const formatDate = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fa-IR');
};

const loadAdmins = async () => {
  try {
    const response = await api.get('/admin/admins');
    if (response.data.success) {
      admins.value = response.data.data || [];
    }
  } catch (err) {
    console.error('Error loading admins:', err);
  }
};

const createAdmin = async () => {
  loading.value = true;
  try {
    await api.post('/admin/admins', newAdmin.value);
    await loadAdmins();
    showCreateModal.value = false;
    newAdmin.value = { first_name: '', last_name: '', mobile_number: '' };
    alert('ادمین با موفقیت ایجاد شد');
  } catch (err) {
    console.error('Error creating admin:', err);
    alert('خطا در ایجاد ادمین');
  } finally {
    loading.value = false;
  }
};

const toggleStatus = async (admin: any) => {
  try {
    await api.put(`/admin/admins/${admin.id}`, { is_active: !admin.is_active });
    await loadAdmins();
  } catch (err) {
    console.error('Error toggling admin status:', err);
  }
};

const deleteAdmin = async (id: number) => {
  if (confirm('آیا از حذف این ادمین اطمینان دارید؟')) {
    try {
      await api.delete(`/admin/admins/${id}`);
      await loadAdmins();
      alert('ادمین با موفقیت حذف شد');
    } catch (err) {
      console.error('Error deleting admin:', err);
      alert('خطا در حذف ادمین');
    }
  }
};

onMounted(() => {
  loadAdmins();
});
</script>

<style scoped>
.admins-page {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.admins-page h1 {
  margin: 0 0 20px;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.btn-create {
  background: #27ae60;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
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
  text-align: right;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
}

.badge-main {
  background: #f39c12;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.badge-normal {
  background: #3498db;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
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
}

.btn-toggle {
  background: #3498db;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-delete {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.no-action {
  color: #999;
  font-size: 12px;
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
  width: 400px;
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

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
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