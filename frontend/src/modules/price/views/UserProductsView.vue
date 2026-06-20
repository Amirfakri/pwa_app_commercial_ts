<template>
  <div class="user-products-page">
    <h1>محصولات و قیمت‌ها</h1>
    <p class="subtitle">قیمت‌ها به صورت لحظه‌ای به‌روزرسانی می‌شوند</p>

    <!-- محصولات آبشده (طلا) -->
    <div class="section">
      <h2>🥇 محصولات آبشده (طلا)</h2>
      <div class="products-grid">
        <div v-for="product in meltedProducts" :key="product.code" class="product-card">
          <div class="product-header">
            <h3>{{ product.display_name || product.name }}</h3>
            <span class="product-code">{{ product.code }}</span>
          </div>
          <div class="product-details">
            <div class="price-row">
              <span class="label">💰 قیمت خرید:</span>
              <span class="value buy-price">{{ formatNumber(product.buy_price) }} ریال</span>
            </div>
            <div class="price-row">
              <span class="label">💵 قیمت فروش:</span>
              <span class="value sell-price">{{ formatNumber(product.sell_price) }} ریال</span>
            </div>
            <div class="price-row" v-if="product.applied_offset !== 0">
              <span class="label">📊 افست اعمال شده:</span>
              <span class="value offset">{{ formatNumber(product.applied_offset) }} تومان</span>
            </div>
            <div class="meta-info">
              <span>⚖️ حداقل وزن: {{ product.min_weight }} گرم</span>
              <span>📦 حداکثر وزن: {{ product.max_weight }} گرم</span>
            </div>
          </div>
          <div class="product-footer">
            <span class="update-time">🕐 آخرین به‌روزرسانی: {{ formatDate(product.updated_at) }}</span>
          </div>
        </div>
      </div>
      <div v-if="meltedProducts.length === 0" class="empty-state">
        <p>هیچ محصول آبشده فعالی یافت نشد</p>
      </div>
    </div>

    <!-- سکه‌ها -->
    <div class="section">
      <h2>🪙 سکه‌ها</h2>
      <div class="products-grid">
        <div v-for="product in coinProducts" :key="product.code" class="product-card">
          <div class="product-header">
            <h3>{{ product.display_name || product.name }}</h3>
            <span class="product-code">{{ product.code }}</span>
          </div>
          <div class="product-details">
            <div class="price-row">
              <span class="label">💰 قیمت خرید:</span>
              <span class="value buy-price">{{ formatNumber(product.buy_price) }} ریال</span>
            </div>
            <div class="price-row">
              <span class="label">💵 قیمت فروش:</span>
              <span class="value sell-price">{{ formatNumber(product.sell_price) }} ریال</span>
            </div>
            <div class="price-row" v-if="product.applied_offset !== 0">
              <span class="label">📊 افست اعمال شده:</span>
              <span class="value offset">{{ formatNumber(product.applied_offset) }} تومان</span>
            </div>
            <div class="meta-info">
              <span>🔢 حداقل تعداد: {{ product.min_count }} عدد</span>
              <span>📦 حداکثر تعداد: {{ product.max_count }} عدد</span>
            </div>
          </div>
          <div class="product-footer">
            <span class="update-time">🕐 آخرین به‌روزرسانی: {{ formatDate(product.updated_at) }}</span>
          </div>
        </div>
      </div>
      <div v-if="coinProducts.length === 0" class="empty-state">
        <p>هیچ سکه فعالی یافت نشد</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/core/http/axios';

const meltedProducts = ref<any[]>([]);
const coinProducts = ref<any[]>([]);
const loading = ref(true);

const formatNumber = (num: number) => {
  if (!num && num !== 0) return '۰';
  return num.toLocaleString('fa-IR');
};

const formatDate = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fa-IR') + ' ' + d.toLocaleTimeString('fa-IR');
};

const loadProducts = async () => {
  loading.value = true;
  try {
    // دریافت محصولات با قیمت برای کاربر جاری
    const response = await api.get('/prices/products');
    if (response.data.success) {
      meltedProducts.value = response.data.data.melted || [];
      coinProducts.value = response.data.data.coins || [];
    }
  } catch (err) {
    console.error('Error loading products:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadProducts();
});
</script>

<style scoped>
.user-products-page {
  padding: 24px;
  min-height: 100vh;
  background: #f5f6fa;
}

.user-products-page h1 {
  margin: 0 0 8px;
  color: #333;
  font-size: 28px;
}

.subtitle {
  color: #666;
  margin-bottom: 32px;
  font-size: 14px;
}

.section {
  margin-bottom: 48px;
}

.section h2 {
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 2px solid #667eea;
  color: #333;
  font-size: 20px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.product-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.product-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  text-align: center;
}

.product-header h3 {
  margin: 0 0 4px;
  font-size: 18px;
}

.product-code {
  font-size: 12px;
  opacity: 0.8;
}

.product-details {
  padding: 16px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.price-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.label {
  color: #666;
  font-size: 14px;
}

.value {
  font-weight: bold;
  font-size: 16px;
}

.buy-price {
  color: #27ae60;
}

.sell-price {
  color: #e74c3c;
}

.offset {
  color: #f39c12;
}

.meta-info {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #eee;
  font-size: 12px;
  color: #999;
}

.product-footer {
  background: #f8f9fa;
  padding: 12px 16px;
  font-size: 11px;
  color: #999;
  text-align: center;
}

.update-time {
  display: block;
}

.empty-state {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 16px;
  color: #999;
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  
  .user-products-page {
    padding: 16px;
  }
}
</style>