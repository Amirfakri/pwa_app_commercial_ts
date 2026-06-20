<template>
  <div class="prices-page">
    <h1>قیمت‌های روز</h1>
    
    <div class="date-info">
      <span>📅 تاریخ امروز: {{ today }}</span>
    </div>

    <!-- محصولات آبشده -->
    <div class="section">
      <h2>محصولات آبشده (طلا)</h2>
      <div class="products-grid">
        <div v-for="product in meltedProducts" :key="product.code" class="product-card">
          <h3>{{ product.display_name || product.name }}</h3>
          <div class="price-row">
            <span class="label">قیمت خرید:</span>
            <span class="value">{{ formatNumber(product.buy_price) }} ریال</span>
          </div>
          <div class="price-row">
            <span class="label">قیمت فروش:</span>
            <span class="value">{{ formatNumber(product.sell_price) }} ریال</span>
          </div>
          <div class="meta">
            <span>حداقل وزن: {{ product.min_weight }} گرم</span>
            <span>حداکثر وزن: {{ product.max_weight }} گرم</span>
          </div>
        </div>
      </div>
    </div>

    <!-- سکه‌ها -->
    <div class="section">
      <h2>سکه‌ها</h2>
      <div class="products-grid">
        <div v-for="product in coinProducts" :key="product.code" class="product-card">
          <h3>{{ product.display_name || product.name }}</h3>
          <div class="price-row">
            <span class="label">قیمت خرید:</span>
            <span class="value">{{ formatNumber(product.buy_price) }} ریال</span>
          </div>
          <div class="price-row">
            <span class="label">قیمت فروش:</span>
            <span class="value">{{ formatNumber(product.sell_price) }} ریال</span>
          </div>
          <div class="meta">
            <span>حداقل تعداد: {{ product.min_count }}</span>
            <span>حداکثر تعداد: {{ product.max_count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/core/http/axios';

const today = ref('');
const meltedProducts = ref<any[]>([]);
const coinProducts = ref<any[]>([]);

const formatNumber = (num: number) => {
  if (!num && num !== 0) return '۰';
  return num.toLocaleString('fa-IR');
};

const loadPrices = async () => {
  try {
    // دریافت همه قیمت‌های امروز
    const response = await api.get('/prices/all');
    if (response.data.success) {
      meltedProducts.value = response.data.melted || [];
      coinProducts.value = response.data.coins || [];
    }
    
    // تاریخ امروز
    const dateRes = await api.get('/health');
    today.value = new Date(dateRes.data.timestamp).toLocaleDateString('fa-IR');
  } catch (err) {
    console.error('Error loading prices:', err);
  }
};

onMounted(() => {
  loadPrices();
});
</script>

<style scoped>
.prices-page {
  padding: 24px;
}

.prices-page h1 {
  margin-bottom: 16px;
  color: #333;
}

.date-info {
  margin-bottom: 32px;
  padding: 12px;
  background: #e8f4f8;
  border-radius: 8px;
  text-align: center;
}

.section {
  margin-bottom: 40px;
}

.section h2 {
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 2px solid #667eea;
  color: #333;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.product-card h3 {
  margin: 0 0 12px;
  color: #333;
  font-size: 16px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.price-row .label {
  color: #666;
}

.price-row .value {
  font-weight: bold;
  color: #27ae60;
}

.meta {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: #999;
  display: flex;
  justify-content: space-between;
}
</style>