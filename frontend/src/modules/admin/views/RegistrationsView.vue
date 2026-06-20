<template>
  <div class="registrations-page">
    <h1>درخواست‌های ثبت‌نام</h1>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>شماره موبایل</th>
            <th>نام</th>
            <th>نام خانوادگی</th>
            <th>کد ملی</th>
            <th>تاریخ درخواست</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reg in registrations" :key="reg.id">
            <td>{{ reg.mobile_number }}</td>
            <td>{{ reg.first_name }}</td>
            <td>{{ reg.last_name }}</td>
            <td>{{ reg.national_code }}</td>
            <td>{{ formatDate(reg.created_at) }}</td>
            <td class="actions">
              <button @click="approve(reg.id)" class="btn-approve">تأیید</button>
              <button @click="reject(reg.id)" class="btn-reject">رد</button>
            </td>
          </tr>
          <tr v-if="registrations.length === 0">
            <td colspan="6" class="empty">هیچ درخواستی وجود ندارد</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/core/http/axios';

const registrations = ref<any[]>([]);

const formatDate = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fa-IR');
};

const loadRegistrations = async () => {
  try {
    const response = await api.get('/admin/pending-registrations');
    if (response.data.success) {
      registrations.value = response.data.data || [];
    }
  } catch (err) {
    console.error('Error loading registrations:', err);
  }
};

const approve = async (id: number) => {
  try {
    await api.put(`/admin/approve-registration/${id}`);
    await loadRegistrations();
    alert('ثبت‌نام با موفقیت تأیید شد');
  } catch (err) {
    console.error('Error approving registration:', err);
    alert('خطا در تأیید ثبت‌نام');
  }
};

const reject = async (id: number) => {
  try {
    await api.put(`/admin/reject-registration/${id}`);
    await loadRegistrations();
    alert('ثبت‌نام رد شد');
  } catch (err) {
    console.error('Error rejecting registration:', err);
    alert('خطا در رد ثبت‌نام');
  }
};

onMounted(() => {
  loadRegistrations();
});
</script>

<style scoped>
.registrations-page {
  background: white;
  border-radius: 12px;
  padding: 20px;
}

.registrations-page h1 {
  margin: 0 0 20px;
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

.actions {
  display: flex;
  gap: 8px;
}

.btn-approve {
  background: #27ae60;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-reject {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px;
}
</style>