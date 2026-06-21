<template>
  <div class="pricing-dashboard">
    <!-- هدر -->
    <div class="dashboard-header">
      <div class="header-title">
        <h1>🏦 مدیریت سامانه</h1>
        <span class="header-badge">ادمین</span>
      </div>
      <div class="header-actions">
        <button 
          @click="showManualTransactionModal = true" 
          class="manual-tx-btn"
        >
          ✏️ ثبت معامله دستی
        </button>
        <button 
          @click="toggleAllPrices" 
          class="toggle-all-btn"
          :class="{ 'active': isGlobalDisabled }"
        >
          🔒 {{ isGlobalDisabled ? 'فعال‌سازی همه قیمت‌ها' : 'غیرفعال‌سازی همه قیمت‌ها' }}
        </button>
        <button @click="refreshPage" class="refresh-btn" title="بروزرسانی صفحه">
          🔄
        </button>
      </div>
    </div>

    <div class="two-column-layout">
      <!-- ستون چپ: مدیریت قیمت‌ها -->
      <div class="pricing-column">
        <div class="card pricing-card">
          <div class="card-header">
            <div class="card-title">
              <span class="title-icon">💰</span>
              <h2>مدیریت قیمت‌ها</h2>
            </div>
            <span class="products-badge">{{ allProducts.length }} محصول</span>
          </div>

          <div class="quick-adjust">
            <div class="adjust-row">
              <span class="adjust-label">سکه‌ها:</span>
              <div class="adjust-input-wrapper">
                <button @click="adjustQuick('coin', -50000)" class="quick-minus">−</button>
                <input 
                  type="text" 
                  :value="formatNumber(coinAdjustment)" 
                  @input="handleCoinAdjustment"
                  class="adjust-input"
                />
                <button @click="adjustQuick('coin', 50000)" class="quick-plus">+</button>
              </div>
            </div>
            <div class="adjust-row">
              <span class="adjust-label">آبشده‌ها:</span>
              <div class="adjust-input-wrapper">
                <button @click="adjustQuick('melted', -50000)" class="quick-minus">−</button>
                <input 
                  type="text" 
                  :value="formatNumber(meltedAdjustment)" 
                  @input="handleMeltedAdjustment"
                  class="adjust-input"
                />
                <button @click="adjustQuick('melted', 50000)" class="quick-plus">+</button>
              </div>
            </div>
          </div>

          <div class="products-list with-scroll">
            <div v-if="loading" class="loading-state">
              <div class="spinner"></div>
              <p>در حال بارگذاری محصولات...</p>
            </div>

            <div v-else-if="allProducts.length === 0" class="empty-state">
              <span class="empty-icon">📦</span>
              <p>هیچ محصولی یافت نشد</p>
            </div>

            <div v-else class="products-grid">
             
                           <!-- آبشده‌ها -->
              <div class="product-category">
                <h3 class="category-title"> آبشده‌ها</h3>
                <div class="category-products">
                  <div 
                    v-for="product in meltedProducts" 
                    :key="product.code"
                    :ref="el => setProductRef(el, product.code)"
                    class="product-card"
                  >
                    <div class="product-header">
                      <div class="product-info">
                        <h3 class="product-name">{{ product.display_name || product.name }}</h3>
                        <span class="product-code">{{ product.code }}</span>
                      </div>
                      <span class="type-badge melted">آبشده</span>
                    </div>

                    <div class="product-range">
                      ⚖️ محدوده وزن: {{ formatNumber(product.min_weight) }} - {{ formatNumber(product.max_weight) }} گرم
                    </div>

                    <div class="prices-row">
                      <div class="price-box">
                        <div class="price-header">
                          <span class="price-title buy-title">💰 قیمت خرید</span>
                          <label class="toggle-switch">
                            <input 
                              type="checkbox" 
                              :checked="isProductBuyEnabled(product)"
                              @change="toggleVisibility(product, 'is_visible_buy')"
                              :disabled="isGlobalDisabled && !hasIndividualOverride(product, 'is_visible_buy')"
                            />
                            <span class="toggle-slider"></span>
                          </label>
                        </div>
                        <div class="price-input-group">
                          <button @click="adjustPrice(product, 'buy_price', 'decrease')" class="price-btn minus">−</button>
                          <input 
                            type="text" 
                            :value="formatPriceValue(product.buy_price)"
                            @blur="updatePrice(product, 'buy_price', $event.target.value)"
                            class="price-input"
                            :class="{ 'price-zero': !product.buy_price || product.buy_price === 0 }"
                          />
                          <button @click="adjustPrice(product, 'buy_price', 'increase')" class="price-btn plus">+</button>
                        </div>
                        <div class="price-status">
                          <span v-if="saving(product, 'buy_price')" class="saving">💾 ذخیره...</span>
                          <span v-else-if="savedMap.get(product.code)" class="saved">✓ ذخیره شد</span>
                        </div>
                      </div>

                      <div class="price-box sell-price-box">
                        <div class="price-header">
                          <span class="price-title sell-title">💵 قیمت فروش</span>
                          <label class="toggle-switch">
                            <input 
                              type="checkbox" 
                              :checked="isProductSellEnabled(product)"
                              @change="toggleVisibility(product, 'is_visible_sell')"
                              :disabled="isGlobalDisabled && !hasIndividualOverride(product, 'is_visible_sell')"
                            />
                            <span class="toggle-slider"></span>
                          </label>
                        </div>
                        <div class="price-input-group">
                          <button @click="adjustSellPrice(product, 'decrease')" class="price-btn minus">−</button>
                          <input 
                            type="text" 
                            :value="formatPriceValue(product.sell_price)"
                            @blur="updatePrice(product, 'sell_price', $event.target.value)"
                            class="price-input"
                            :class="{ 'price-zero': !product.sell_price || product.sell_price === 0 }"
                          />
                          <button @click="adjustSellPrice(product, 'increase')" class="price-btn plus">+</button>
                        </div>
                        <div class="price-status">
                          <span v-if="saving(product, 'sell_price')" class="saving">💾 ذخیره...</span>
                          <span v-else-if="savedMap.get(product.code)" class="saved">✓ ذخیره شد</span>
                        </div>
                      </div>
                    </div>

                    <div class="product-footer">
                      <span class="update-time">🕐 آخرین بروزرسانی: {{ formatDateTime(product.updated_at) }}</span>
                      <div v-if="product.buy_price !== null && product.buy_price > 0" class="auto-spread-footer">
                        <label class="auto-spread-footer-label">
                          <input 
                            type="checkbox" 
                            :checked="getProductAutoSpread(product)"
                            @change="toggleProductAutoSpread(product)"
                          />
                          <span class="auto-spread-footer-text">فاصله خودکار</span>
                        </label>
                        <div v-if="getProductAutoSpread(product)" class="auto-spread-footer-control">
                          <button @click="decreaseProductSpread(product)" class="spread-footer-btn">−</button>
                          <input 
                            type="text" 
                            :value="formatNumberShort(getProductSpreadValue(product))"
                            @input="updateProductSpreadInput(product, $event)"
                            @blur="saveProductSpreadValue(product)"
                            class="spread-footer-input"
                          />
                          <button @click="increaseProductSpread(product)" class="spread-footer-btn">+</button>
                          <span class="spread-footer-unit">ریال</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
             
             
              <!-- سکه‌ها -->
              <div class="product-category">
                <h3 class="category-title"> سکه‌ها</h3>
                <div class="category-products">
                  <div 
                    v-for="product in coinProducts" 
                    :key="product.code"
                    :ref="el => setProductRef(el, product.code)"
                    class="product-card"
                  >
                    <div class="product-header">
                      <div class="product-info">
                        <h3 class="product-name">{{ product.display_name || product.name }}</h3>
                        <span class="product-code">{{ product.code }}</span>
                      </div>
                      <span class="type-badge coin">سکه</span>
                    </div>

                    <div class="product-range">
                      🔢 محدوده تعداد: {{ formatNumber(product.min_count) }} - {{ formatNumber(product.max_count) }} عدد
                    </div>

                    <div class="prices-row">
                      <div class="price-box">
                        <div class="price-header">
                          <span class="price-title buy-title">💰 قیمت خرید</span>
                          <label class="toggle-switch">
                            <input 
                              type="checkbox" 
                              :checked="isProductBuyEnabled(product)"
                              @change="toggleVisibility(product, 'is_visible_buy')"
                              :disabled="isGlobalDisabled && !hasIndividualOverride(product, 'is_visible_buy')"
                            />
                            <span class="toggle-slider"></span>
                          </label>
                        </div>
                        <div class="price-input-group">
                          <button @click="adjustPrice(product, 'buy_price', 'decrease')" class="price-btn minus">−</button>
                          <input 
                            type="text" 
                            :value="formatPriceValue(product.buy_price)"
                            @blur="updatePrice(product, 'buy_price', $event.target.value)"
                            class="price-input"
                            :class="{ 'price-zero': !product.buy_price || product.buy_price === 0 }"
                          />
                          <button @click="adjustPrice(product, 'buy_price', 'increase')" class="price-btn plus">+</button>
                        </div>
                        <div class="price-status">
                          <span v-if="saving(product, 'buy_price')" class="saving">💾 ذخیره...</span>
                          <span v-else-if="savedMap.get(product.code)" class="saved">✓ ذخیره شد</span>
                        </div>
                      </div>

                      <div class="price-box sell-price-box">
                        <div class="price-header">
                          <span class="price-title sell-title">💵 قیمت فروش</span>
                          <label class="toggle-switch">
                            <input 
                              type="checkbox" 
                              :checked="isProductSellEnabled(product)"
                              @change="toggleVisibility(product, 'is_visible_sell')"
                              :disabled="isGlobalDisabled && !hasIndividualOverride(product, 'is_visible_sell')"
                            />
                            <span class="toggle-slider"></span>
                          </label>
                        </div>
                        <div class="price-input-group">
                          <button @click="adjustSellPrice(product, 'decrease')" class="price-btn minus">−</button>
                          <input 
                            type="text" 
                            :value="formatPriceValue(product.sell_price)"
                            @blur="updatePrice(product, 'sell_price', $event.target.value)"
                            class="price-input"
                            :class="{ 'price-zero': !product.sell_price || product.sell_price === 0 }"
                          />
                          <button @click="adjustSellPrice(product, 'increase')" class="price-btn plus">+</button>
                        </div>
                        <div class="price-status">
                          <span v-if="saving(product, 'sell_price')" class="saving">💾 ذخیره...</span>
                          <span v-else-if="savedMap.get(product.code)" class="saved">✓ ذخیره شد</span>
                        </div>
                      </div>
                    </div>

                    <div class="product-footer">
                      <span class="update-time">🕐 آخرین بروزرسانی: {{ formatDateTime(product.updated_at) }}</span>
                      <div v-if="product.buy_price !== null && product.buy_price > 0" class="auto-spread-footer">
                        <label class="auto-spread-footer-label">
                          <input 
                            type="checkbox" 
                            :checked="getProductAutoSpread(product)"
                            @change="toggleProductAutoSpread(product)"
                          />
                          <span class="auto-spread-footer-text">فاصله خودکار</span>
                        </label>
                        <div v-if="getProductAutoSpread(product)" class="auto-spread-footer-control">
                          <button @click="decreaseProductSpread(product)" class="spread-footer-btn">−</button>
                          <input 
                            type="text" 
                            :value="formatNumberShort(getProductSpreadValue(product))"
                            @input="updateProductSpreadInput(product, $event)"
                            @blur="saveProductSpreadValue(product)"
                            class="spread-footer-input"
                          />
                          <button @click="increaseProductSpread(product)" class="spread-footer-btn">+</button>
                          <span class="spread-footer-unit">ریال</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ستون راست: تراکنش‌های امروز -->
      <div class="transactions-column">
        <div class="card transactions-card">
          <div class="card-header">
            <div class="card-title">
              <span class="title-icon">📋</span>
              <h2>تراکنش‌های امروز</h2>
            </div>
            <div class="pending-badge" v-if="pendingTransactions.length > 0">
              {{ pendingTransactions.length }} در انتظار
            </div>
          </div>

          <div class="filters-bar">
            <select v-model="txFilterStatus" class="filter-select">
              <option value="">همه وضعیت‌ها</option>
              <option value="pending">⏳ در انتظار</option>
              <option value="approved">✅ تأیید شده</option>
              <option value="rejected">❌ رد شده</option>
              <option value="expired">⌛ منقضی شده</option>
            </select>
            <button @click="loadTodayTransactions" class="refresh-tx-btn">
              🔄 بروزرسانی
            </button>
          </div>

          <div class="transactions-list">
            <div v-if="txLoading" class="loading-state">
              <div class="spinner"></div>
              <p>در حال بارگذاری تراکنش‌ها...</p>
            </div>

            <div v-else-if="todayTransactions.length === 0" class="empty-state">
              <span class="empty-icon">📭</span>
              <p>هیچ تراکنشی برای امروز یافت نشد</p>
            </div>

            <div v-else class="transactions-grid">
              <div 
                v-for="tx in filteredTodayTransactions" 
                :key="tx.id" 
                class="tx-card"
                :class="{
                  'tx-pending': tx.status === 'pending',
                  'tx-approved': tx.status === 'approved',
                  'tx-rejected': tx.status === 'rejected',
                  'tx-expired': tx.status === 'expired'
                }"
              >
                <div class="tx-header">
                  <div class="tx-user">
                    <strong class="user-name">{{ getUserName(tx) }}</strong>
                    <span class="user-code">{{ tx.user_info?.code || tx.user_code || '-' }}</span>
                  </div>
                  <div class="tx-time">{{ formatTime(tx.created_at) }}</div>
                </div>

                <div class="tx-body">
                  <div class="tx-product">
                    <span class="product-name">{{ tx.display_name || tx.product_code }}</span>
                    <span :class="tx.type === 'خرید' ? 'type-buy-blue' : 'type-sell'">
                      {{ tx.type === 'خرید' ? 'خرید' : 'فروش' }}
                    </span>
                  </div>
                  <div class="tx-details">
                    <div class="detail-item">
                      <span class="detail-label">مقدار:</span>
                      <span class="detail-value">{{ formatQuantity(tx) }}</span>
                      <span class="detail-unit">{{ tx.coin_quantity ? 'عدد' : 'گرم' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">مبلغ:</span>
                      <span class="detail-value amount-value">{{ formatNumber(tx.amount) }}</span>
                      <span class="detail-unit">ریال</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">قیمت واحد:</span>
                      <span class="detail-value">{{ formatNumber(tx.transaction_price) }}</span>
                      <span class="detail-unit">ریال</span>
                    </div>
                  </div>
                </div>

                <div class="tx-footer">
                  <div v-if="tx.status === 'pending'" class="timer-section">
                    <div class="timer-display" :class="{ 'timer-warning': tx.remaining_seconds <= 10 }">
                      <span class="timer-icon">⏱️</span>
                      <span class="timer-value">{{ formatRemainingTime(tx.remaining_seconds) }}</span>
                      <span class="timer-label">زمان باقیمانده</span>
                    </div>
                    <div class="action-buttons">
                      <button @click="approveTransaction(tx)" class="btn-approve" :disabled="txProcessing">
                        ✓ تأیید
                      </button>
                      <button @click="rejectTransaction(tx)" class="btn-reject" :disabled="txProcessing">
                        ✕ رد
                      </button>
                    </div>
                  </div>
                  <div v-else class="status-badge" :class="'status-' + tx.status">
                    {{ getStatusText(tx.status) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- مودال ثبت معامله دستی -->
    <div v-if="showManualTransactionModal" class="modal-overlay" @click.self="closeManualModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>✏️ ثبت معامله دستی</h3>
          <button class="modal-close" @click="closeManualModal">×</button>
        </div>
        
        <div class="modal-body">
          <!-- جستجوی کاربر (مشابه صفحه کاربران) -->
          <div class="form-group">
            <label>انتخاب کاربر <span class="required">*</span></label>
            <div class="user-search-wrapper">
              <input 
                type="text" 
                v-model="userSearchQuery"
                @input="searchUsers"
                @focus="searchUsers"
                placeholder="جستجو بر اساس نام، نام خانوادگی، کد یا شماره موبایل..."
                class="form-input"
                autocomplete="off"
              />
              <div v-if="searchResults.length > 0 && !selectedUser" class="user-search-results">
                <div 
                  v-for="user in searchResults" 
                  :key="user.id"
                  @click="selectUser(user)"
                  class="search-result-item"
                >
                  <div class="result-name">{{ user.full_name || user.first_name + ' ' + user.last_name || 'بی‌نام' }}</div>
                  <div class="result-details">
                    <span class="result-code">کد: {{ user.code }}</span>
                    <span class="result-mobile">📱 {{ user.mobile_number }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- نمایش کاربر انتخاب شده -->
          <div v-if="selectedUser" class="selected-user-info">
            <div class="user-avatar">👤</div>
            <div class="user-info-details">
              <div class="user-name">{{ selectedUser.full_name || selectedUser.first_name + ' ' + selectedUser.last_name }}</div>
              <div class="user-meta">
                <span>کد: {{ selectedUser.code }}</span>
                <span>📱 {{ selectedUser.mobile_number }}</span>
                <span v-if="selectedUser.device_limit">📱 دستگاه‌ها: {{ selectedUser.device_limit }}</span>
              </div>
            </div>
            <button @click="clearSelectedUser" class="remove-user-btn" title="حذف کاربر">×</button>
          </div>

          <div class="form-group">
            <label>نوع محصول <span class="required">*</span></label>
            <select v-model="manualTx.productType" class="form-select" @change="onProductTypeChange">
              <option value="">انتخاب کنید...</option>
              <option value="coin">🪙 سکه</option>
              <option value="melted">🥇 آبشده</option>
            </select>
          </div>

          <div class="form-group" v-if="manualTx.productType">
            <label>محصول <span class="required">*</span></label>
            <select v-model="manualTx.productCode" class="form-select" @change="onProductChange">
              <option value="">انتخاب کنید...</option>
              <option 
                v-for="product in availableProducts" 
                :key="product.code" 
                :value="product.code"
              >
                {{ product.display_name || product.name }} ({{ product.code }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>نوع معامله <span class="required">*</span></label>
            <div class="type-selector">
              <button 
                type="button"
                :class="['type-btn', 'buy-type', { active: manualTx.type === 'buy' }]"
                @click="manualTx.type = 'buy'"
              >
                💰 خرید (ادمین از کاربر)
              </button>
              <button 
                type="button"
                :class="['type-btn', 'sell-type', { active: manualTx.type === 'sell' }]"
                @click="manualTx.type = 'sell'"
              >
                💵 فروش (ادمین به کاربر)
              </button>
            </div>
          </div>

          <!-- برای سکه‌ها -->
          <div v-if="manualTx.productType === 'coin'" class="form-row">
            <div class="form-group half">
              <label>تعداد (عدد) <span class="required">*</span></label>
              <input 
                type="number" 
                v-model.number="manualTx.quantity"
                step="any"
                class="form-input"
                placeholder="مثال: 1"
              />
            </div>
            <div class="form-group half">
              <label>قیمت واحد (ریال) <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="manualTx.unitPriceRaw"
                @input="formatUnitPriceInput"
                class="form-input"
                placeholder="مثال: ۵۰,۰۰۰,۰۰۰"
              />
            </div>
          </div>

          <!-- برای محصولات آبشده -->
          <div v-if="manualTx.productType === 'melted'">
            <div class="form-group">
              <label>قیمت واحد (ریال/گرم) <span class="required">*</span></label>
              <input 
                type="text" 
                v-model="manualTx.unitPriceRaw"
                @input="formatUnitPriceInput"
                class="form-input"
                placeholder="مثال: ۱,۲۰۰,۰۰۰"
              />
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label>مبلغ (ریال) <span class="required">*</span></label>
                <input 
                  type="text" 
                  v-model="manualTx.amountRaw"
                  @input="handleMeltedAmountInput"
                  class="form-input"
                  placeholder="مثال: ۱۰,۳۰۰,۰۰۰"
                />
              </div>
              <div class="form-group half">
                <label>وزن محاسبه شده (گرم)</label>
                <div class="price-display-group">
                  <span class="calculated-price">{{ meltedWeightFromAmount.toFixed(3) }}</span>
                  <span class="price-note">گرم</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label>وزن (گرم) <span class="required">*</span></label>
                <input 
                  type="number" 
                  v-model.number="manualTx.quantity"
                  @input="handleMeltedWeightInput"
                  step="0.001"
                  min="0"
                  class="form-input"
                  placeholder="مثال: 8.500"
                />
              </div>
              <div class="form-group half">
                <label>مبلغ محاسبه شده (ریال)</label>
                <div class="price-display-group">
                  <span class="calculated-price">{{ formatNumber(meltedAmountFromWeight) }}</span>
                  <span class="price-note">ریال</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <div class="field-hint">
                فرمول: وزن = مبلغ ÷ (قیمت ÷ 4.3318)
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>وضعیت <span class="required">*</span></label>
            <select v-model="manualTx.status" class="form-select">
              <option value="approved">✅ تأیید شده (فوری)</option>
              <option value="pending">⏳ در انتظار (نیاز به تأیید)</option>
            </select>
            <div class="field-hint" v-if="manualTx.status === 'pending'">
              تراکنش در حالت انتظار ثبت می‌شود و نیاز به تأیید ادمین دارد
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeManualModal">انصراف</button>
          <button class="btn-submit" @click="submitManualTransaction" :disabled="manualSubmitting">
            {{ manualSubmitting ? 'در حال ثبت...' : 'ثبت معامله' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { api } from '@/core/http/axios';
import { connectSocket } from '@/core/socket/socket.io';

// ==================== State ====================
const allProducts = ref<any[]>([]);
const loading = ref(true);
const savingMap = ref<Map<string, boolean>>(new Map());
const savedMap = ref<Map<string, boolean>>(new Map());
const coinAdjustment = ref(50000);
const meltedAdjustment = ref(50000);
const isUpdatingPrices = ref(false);

// وضعیت global disable
const isGlobalDisabled = ref(false);
const savedVisibilityState = ref<Map<string, { buy: boolean; sell: boolean }>>(new Map());

// Auto spread برای هر محصول
const productAutoSpread = ref<Map<string, { enabled: boolean; value: number }>>(new Map());

// ذخیره رفرنس المنت‌ها
const productRefs = ref<Map<string, HTMLElement>>(new Map());
const activeProductCode = ref<string | null>(null);

// تراکنش‌ها
const allTransactions = ref<any[]>([]);
const txLoading = ref(false);
const txProcessing = ref(false);
const txFilterStatus = ref('');
let socket: any = null;
let refreshInterval: any = null;
let localTimerInterval: any = null;
const timerTotal = ref(30);

// کلیدهای localStorage
const GLOBAL_DISABLE_KEY = 'admin_global_prices_disabled';
const PRODUCT_AUTO_SPREAD_KEY = 'admin_product_auto_spread_v5';

// ==================== State برای معامله دستی ====================
const showManualTransactionModal = ref(false);
const manualSubmitting = ref(false);
const userSearchQuery = ref('');
const searchResults = ref<any[]>([]);
const selectedUser = ref<any>(null);
let searchDebounceTimer: any = null;

const manualTx = ref({
  productType: '' as 'coin' | 'melted' | '',
  productCode: '',
  type: 'buy' as 'buy' | 'sell',
  quantity: null as number | null,
  unitPriceRaw: '',
  unitPrice: 0,
  status: 'approved' as 'pending' | 'approved',
  // برای محصولات آبشده
  amountRaw: '',
  amount: 0,
  weightCalculated: 0
});

// ==================== Computed ====================
const coinProducts = computed(() => 
  allProducts.value.filter(p => p.type === 'coin')
);

const meltedProducts = computed(() => 
  allProducts.value.filter(p => p.type === 'melted')
);

const getTodayIranDate = () => {
  const now = new Date();
  const iranTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tehran' }));
  return iranTime.toISOString().split('T')[0];
};

const todayTransactions = computed(() => {
  const today = getTodayIranDate();
  return allTransactions.value.filter(tx => {
    const txDate = new Date(tx.created_at).toISOString().split('T')[0];
    return txDate === today;
  });
});

const pendingTransactions = computed(() => 
  todayTransactions.value.filter(tx => tx.status === 'pending')
);

const filteredTodayTransactions = computed(() => {
  if (!txFilterStatus.value) return todayTransactions.value;
  return todayTransactions.value.filter(tx => tx.status === txFilterStatus.value);
});

const availableProducts = computed(() => {
  if (!manualTx.value.productType) return [];
  return allProducts.value.filter(p => p.type === manualTx.value.productType);
});

const selectedProduct = computed(() => {
  if (!manualTx.value.productCode) return null;
  return allProducts.value.find(p => p.code === manualTx.value.productCode);
});

const calculatedTotalAmount = computed(() => {
  if (manualTx.value.productType === 'melted') {
    return manualTx.value.amount || 0;
  }
  if (!manualTx.value.quantity || !manualTx.value.unitPrice) return 0;
  if (manualTx.value.quantity <= 0 || manualTx.value.unitPrice <= 0) return 0;
  return manualTx.value.quantity * manualTx.value.unitPrice;
});

const MELTED_GRAM_RATIO = 4.3318;

const meltedWeightFromAmount = computed(() => {
  if (!manualTx.value.amount || !manualTx.value.unitPrice) return 0;
  const weight = manualTx.value.amount / (manualTx.value.unitPrice / MELTED_GRAM_RATIO);
  return parseFloat(weight.toFixed(3));
});

const meltedAmountFromWeight = computed(() => {
  if (!manualTx.value.quantity || !manualTx.value.unitPrice) return 0;
  const amount = (manualTx.value.unitPrice / MELTED_GRAM_RATIO) * manualTx.value.quantity;
  return Math.floor(amount);
});

// ==================== Helper Functions ====================
const formatNumberShort = (num: number) => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const toEnglishNumber = (str: string) => {
  if (!str) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = str;
  persianDigits.forEach((d, i) => result = result.replace(new RegExp(d, 'g'), i.toString()));
  arabicDigits.forEach((d, i) => result = result.replace(new RegExp(d, 'g'), i.toString()));
  return result;
};

const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return '۰';
  if (num === 0) return '۰';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',').replace(/[0-9]/g, d => persianDigits[parseInt(d)]);
};

const parseFormattedNumber = (str: string): number => {
  if (!str) return 0;
  let cleaned = toEnglishNumber(str).replace(/,/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

// ==================== Manual Transaction Functions ====================
const searchUsers = async () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  
  searchDebounceTimer = setTimeout(async () => {
    const query = userSearchQuery.value.trim();
    if (query.length < 2) {
      searchResults.value = [];
      return;
    }
    
    try {
      // استفاده از API مشابه صفحه مدیریت کاربران
      const response = await api.get('/admin/users', {
        params: { search: query, limit: 10 }
      });
      if (response.data.success) {
        // فیلتر کردن ادمین‌ها
        const nonAdminUsers = (response.data.data || []).filter((u: any) => !u.is_admin);
        searchResults.value = nonAdminUsers;
      }
    } catch (err) {
      console.error('Error searching users:', err);
      searchResults.value = [];
    }
  }, 500);
};

const selectUser = (user: any) => {
  selectedUser.value = user;
  userSearchQuery.value = '';
  searchResults.value = [];
};

const clearSelectedUser = () => {
  selectedUser.value = null;
};

const onProductTypeChange = () => {
  manualTx.value.productCode = '';
  manualTx.value.quantity = null;
};

const onProductChange = () => {
  manualTx.value.quantity = null;
  manualTx.value.amount = 0;
  manualTx.value.amountRaw = '';
  manualTx.value.weightCalculated = 0;
  // اگر محصول انتخاب شد و قیمت پیش‌فرضی دارد، می‌توان نمایش داد
  if (selectedProduct.value && manualTx.value.type === 'buy') {
    // پیشنهاد قیمت پیش‌فرض (اختیاری)
    const defaultPrice = selectedProduct.value.sell_price;
    if (defaultPrice && defaultPrice > 0) {
      manualTx.value.unitPriceRaw = formatNumber(defaultPrice);
      manualTx.value.unitPrice = defaultPrice;
    }
  } else if (selectedProduct.value && manualTx.value.type === 'sell') {
    const defaultPrice = selectedProduct.value.buy_price;
    if (defaultPrice && defaultPrice > 0) {
      manualTx.value.unitPriceRaw = formatNumber(defaultPrice);
      manualTx.value.unitPrice = defaultPrice;
    }
  }
};

const handleMeltedAmountInput = () => {
  const value = parseFormattedNumber(manualTx.value.amountRaw);
  manualTx.value.amount = value;
  if (value > 0) {
    manualTx.value.amountRaw = formatNumber(value);
    manualTx.value.weightCalculated = meltedWeightFromAmount.value;
  } else {
    manualTx.value.amountRaw = '';
    manualTx.value.weightCalculated = 0;
  }
};

const handleMeltedWeightInput = () => {
  if (manualTx.value.quantity && manualTx.value.quantity > 0) {
    manualTx.value.amount = meltedAmountFromWeight.value;
    manualTx.value.amountRaw = formatNumber(manualTx.value.amount);
  }
};

const formatUnitPriceInput = () => {
  const value = parseFormattedNumber(manualTx.value.unitPriceRaw);
  manualTx.value.unitPrice = value;
  if (value > 0) {
    manualTx.value.unitPriceRaw = formatNumber(value);
  } else {
    manualTx.value.unitPriceRaw = '';
  }
};

const submitManualTransaction = async () => {
  // اعتبارسنجی
  if (!selectedUser.value) {
    alert('لطفاً کاربر مورد نظر را انتخاب کنید');
    return;
  }
  if (!manualTx.value.productCode) {
    alert('لطفاً محصول را انتخاب کنید');
    return;
  }
  if (!manualTx.value.unitPrice || manualTx.value.unitPrice <= 0) {
    alert('لطفاً قیمت واحد معتبر وارد کنید');
    return;
  }
  
  // اعتبارسنجی بر اساس نوع محصول
  if (manualTx.value.productType === 'melted') {
    if (!manualTx.value.amount || manualTx.value.amount <= 0) {
      alert('لطفاً مبلغ معتبر وارد کنید');
      return;
    }
    if (!manualTx.value.quantity || manualTx.value.quantity <= 0) {
      alert('لطفاً وزن معتبر وارد کنید');
      return;
    }
  } else {
    if (!manualTx.value.quantity || manualTx.value.quantity <= 0) {
      alert('لطفاً مقدار معتبر وارد کنید');
      return;
    }
  }
  
  const totalAmount = calculatedTotalAmount.value;
  if (totalAmount <= 0) {
    alert('مبلغ کل باید بزرگتر از صفر باشد');
    return;
  }
  
  // تایید نهایی
  const product = selectedProduct.value;
  const confirmMessage = `
    کاربر: ${selectedUser.value.full_name || selectedUser.value.first_name + ' ' + selectedUser.value.last_name}
    محصول: ${product?.display_name || product?.name || manualTx.value.productCode}
    نوع: ${manualTx.value.type === 'buy' ? 'خرید از کاربر' : 'فروش به کاربر'}
    ${manualTx.value.productType === 'coin' ? `تعداد: ${formatNumber(manualTx.value.quantity)} عدد` : `وزن: ${manualTx.value.quantity.toFixed(3)} گرم`}
    قیمت واحد: ${formatNumber(manualTx.value.unitPrice)} ریال
    مبلغ کل: ${formatNumber(totalAmount)} ریال
    وضعیت: ${manualTx.value.status === 'approved' ? 'تأیید شده (فوری)' : 'در انتظار تأیید'}
    
    آیا از ثبت این معامله اطمینان دارید؟
  `;
  
  if (!confirm(confirmMessage)) return;
  
  manualSubmitting.value = true;
  
  try {
    const payload: any = {
      user_id: selectedUser.value.id,
      product_code: manualTx.value.productCode,
      type: manualTx.value.type,
      transaction_price: manualTx.value.unitPrice,
      status: manualTx.value.status,
      is_manual: true
    };
    
    if (manualTx.value.productType === 'coin') {
      payload.amount = Math.floor(manualTx.value.quantity * manualTx.value.unitPrice);
      payload.coin_quantity = Math.floor(manualTx.value.quantity);
    } else {
      payload.amount = manualTx.value.amount;
      payload.melted_weight = parseFloat(manualTx.value.quantity.toFixed(3));
    }
    
    const response = await api.post('/transactions/admin/manual', payload);
    
    if (response.data.success) {
      alert('معامله با موفقیت ثبت شد');
      closeManualModal();
      // بارگذاری تراکنش‌های امروز
      await loadTodayTransactions();
      
      // ارسال از طریق socket
      if (socket) {
        socket.emit('manual_transaction_created', response.data.data);
      }
    } else {
      alert(response.data.error || 'خطا در ثبت معامله');
    }
  } catch (err: any) {
    console.error('Error creating manual transaction:', err);
    alert(err.response?.data?.error || 'خطا در ثبت معامله');
  } finally {
    manualSubmitting.value = false;
  }
};

const closeManualModal = () => {
  showManualTransactionModal.value = false;
  manualTx.value = {
    productType: '',
    productCode: '',
    type: 'buy',
    quantity: null,
    unitPriceRaw: '',
    unitPrice: 0,
    status: 'approved',
    amountRaw: '',
    amount: 0,
    weightCalculated: 0
  };
  selectedUser.value = null;
  userSearchQuery.value = '';
  searchResults.value = [];
};

// ==================== Product Auto Spread Functions ====================
const getProductKey = (product: any) => `${product.type}_${product.code}`;

const loadProductAutoSpreadSettings = () => {
  const saved = localStorage.getItem(PRODUCT_AUTO_SPREAD_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      productAutoSpread.value = new Map(Object.entries(parsed));
    } catch (e) {
      console.error('Error loading product auto spread settings:', e);
    }
  }
};

const saveProductAutoSpreadSettings = () => {
  const obj: Record<string, any> = {};
  productAutoSpread.value.forEach((value, key) => {
    obj[key] = value;
  });
  localStorage.setItem(PRODUCT_AUTO_SPREAD_KEY, JSON.stringify(obj));
};

const getProductAutoSpread = (product: any): boolean => {
  const key = getProductKey(product);
  const setting = productAutoSpread.value.get(key);
  return setting?.enabled || false;
};

const getProductSpreadValue = (product: any): number => {
  const key = getProductKey(product);
  const setting = productAutoSpread.value.get(key);
  return setting?.value || 50000;
};

const setProductAutoSpread = (product: any, enabled: boolean, value?: number) => {
  const key = getProductKey(product);
  const current = productAutoSpread.value.get(key) || { enabled: false, value: 50000 };
  productAutoSpread.value.set(key, {
    enabled: enabled,
    value: value !== undefined ? value : current.value
  });
  saveProductAutoSpreadSettings();
  product._autoSpreadEnabled = enabled;
  product._autoSpreadValue = value !== undefined ? value : current.value;
};

const toggleProductAutoSpread = (product: any) => {
  const current = getProductAutoSpread(product);
  const newEnabled = !current;
  const spreadValue = getProductSpreadValue(product);
  
  setProductAutoSpread(product, newEnabled, spreadValue);
  
  if (newEnabled && product.buy_price !== null && product.buy_price > 0) {
    const newSellPrice = product.buy_price + spreadValue;
    if (product.sell_price !== newSellPrice) {
      product.sell_price = newSellPrice;
      savePrice(product, 'sell_price');
    }
  }
};

const updateProductSpreadInput = (product: any, event: Event) => {
  const input = event.target as HTMLInputElement;
  let rawValue = input.value.replace(/,/g, '');
  let numValue = parseInt(rawValue);
  if (isNaN(numValue)) numValue = 0;
  if (numValue < 0) numValue = 0;
  if (numValue > 100000000) numValue = 100000000;
  product._tempSpreadValue = numValue;
};

const saveProductSpreadValue = (product: any) => {
  const key = getProductKey(product);
  const currentSetting = productAutoSpread.value.get(key) || { enabled: false, value: 50000 };
  let newValue = product._tempSpreadValue;
  if (newValue === undefined || isNaN(newValue)) newValue = currentSetting.value;
  
  setProductAutoSpread(product, currentSetting.enabled, newValue);
  
  if (currentSetting.enabled && product.buy_price !== null && product.buy_price > 0) {
    const newSellPrice = product.buy_price + newValue;
    if (product.sell_price !== newSellPrice) {
      product.sell_price = newSellPrice;
      savePrice(product, 'sell_price');
    }
  }
  delete product._tempSpreadValue;
};

const increaseProductSpread = (product: any) => {
  const key = getProductKey(product);
  const currentSetting = productAutoSpread.value.get(key) || { enabled: false, value: 50000 };
  let step = 10000;
  let newValue = currentSetting.value + step;
  if (newValue > 100000000) newValue = 100000000;
  
  setProductAutoSpread(product, currentSetting.enabled, newValue);
  
  if (currentSetting.enabled && product.buy_price !== null && product.buy_price > 0) {
    const newSellPrice = product.buy_price + newValue;
    if (product.sell_price !== newSellPrice) {
      product.sell_price = newSellPrice;
      savePrice(product, 'sell_price');
    }
  }
};

const decreaseProductSpread = (product: any) => {
  const key = getProductKey(product);
  const currentSetting = productAutoSpread.value.get(key) || { enabled: false, value: 50000 };
  let step = 10000;
  let newValue = currentSetting.value - step;
  if (newValue < 0) newValue = 0;
  
  setProductAutoSpread(product, currentSetting.enabled, newValue);
  
  if (currentSetting.enabled && product.buy_price !== null && product.buy_price > 0) {
    const newSellPrice = product.buy_price + newValue;
    if (product.sell_price !== newSellPrice) {
      product.sell_price = newSellPrice;
      savePrice(product, 'sell_price');
    }
  }
};

const adjustSellPrice = (product: any, operation: 'increase' | 'decrease') => {
  if (getProductAutoSpread(product)) {
    setProductAutoSpread(product, false, getProductSpreadValue(product));
  }
  
  const adjustment = product.type === 'melted' ? meltedAdjustment.value : coinAdjustment.value;
  let currentPrice = product.sell_price;
  
  if (currentPrice === null || currentPrice === undefined) {
    currentPrice = 0;
  }
  
  let newPrice = operation === 'increase' ? currentPrice + adjustment : currentPrice - adjustment;
  if (newPrice < 0) newPrice = 0;
  
  product.sell_price = newPrice;
  savePrice(product, 'sell_price');
};

// ==================== Timer Functions ====================
const formatRemainingTime = (seconds: number) => {
  if (!seconds && seconds !== 0) return '--';
  if (seconds <= 0) return '۰';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  return `${formatNumber(secs)} ثانیه`;
};

const updateRemainingTimes = () => {
  const now = new Date();
  allTransactions.value.forEach(tx => {
    if (tx.status === 'pending') {
      const createdAt = new Date(tx.created_at);
      const elapsed = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
      const remaining = Math.max(0, timerTotal.value - elapsed);
      tx.remaining_seconds = remaining;
      if (remaining === 0 && tx.status === 'pending') {
        tx.status = 'expired';
      }
    }
  });
};

const startLocalTimer = () => {
  if (localTimerInterval) clearInterval(localTimerInterval);
  localTimerInterval = setInterval(() => updateRemainingTimes(), 1000);
};

const stopLocalTimer = () => {
  if (localTimerInterval) {
    clearInterval(localTimerInterval);
    localTimerInterval = null;
  }
};

const loadTimerConfig = async () => {
  try {
    const response = await api.get('/admin/timer');
    if (response.data.success && response.data.data) {
      timerTotal.value = response.data.data.value;
    }
  } catch (err) {
    console.error('Error loading timer config:', err);
    timerTotal.value = 30;
  }
};

// ==================== Global Disable Functions ====================
const hasIndividualOverride = (product: any, field: 'is_visible_buy' | 'is_visible_sell') => {
  const saved = savedVisibilityState.value.get(product.code);
  if (!saved) return false;
  return field === 'is_visible_buy' ? saved.buy !== null : saved.sell !== null;
};

const isProductBuyEnabled = (product: any) => {
  if (isGlobalDisabled.value) {
    const saved = savedVisibilityState.value.get(product.code);
    return saved ? saved.buy : false;
  }
  return product.is_visible_buy === true;
};

const isProductSellEnabled = (product: any) => {
  if (isGlobalDisabled.value) {
    const saved = savedVisibilityState.value.get(product.code);
    return saved ? saved.sell : false;
  }
  return product.is_visible_sell === true;
};

const saveCurrentVisibilityState = () => {
  const state = new Map<string, { buy: boolean; sell: boolean }>();
  allProducts.value.forEach(product => {
    state.set(product.code, {
      buy: product.is_visible_buy === true,
      sell: product.is_visible_sell === true
    });
  });
  savedVisibilityState.value = state;
};

const restoreVisibilityState = async () => {
  for (const [productCode, state] of savedVisibilityState.value) {
    const product = allProducts.value.find(p => p.code === productCode);
    if (product) {
      if (product.is_visible_buy !== state.buy) {
        product.is_visible_buy = state.buy;
        await saveVisibilityToServer(product, 'is_visible_buy', state.buy);
      }
      if (product.is_visible_sell !== state.sell) {
        product.is_visible_sell = state.sell;
        await saveVisibilityToServer(product, 'is_visible_sell', state.sell);
      }
    }
  }
  savedVisibilityState.value.clear();
};

const saveVisibilityToServer = async (product: any, field: string, value: boolean) => {
  try {
    const data: any = {
      product_code: product.code,
      [field]: value
    };
    await api.post('/prices', data);
  } catch (err) {
    console.error('Error saving visibility:', err);
  }
};

const toggleAllPrices = async () => {
  if (!isGlobalDisabled.value) {
    saveCurrentVisibilityState();
    for (const product of allProducts.value) {
      if (product.is_visible_buy) {
        product.is_visible_buy = false;
        await saveVisibilityToServer(product, 'is_visible_buy', false);
      }
      if (product.is_visible_sell) {
        product.is_visible_sell = false;
        await saveVisibilityToServer(product, 'is_visible_sell', false);
      }
    }
    isGlobalDisabled.value = true;
    localStorage.setItem(GLOBAL_DISABLE_KEY, 'true');
  } else {
    await restoreVisibilityState();
    isGlobalDisabled.value = false;
    localStorage.setItem(GLOBAL_DISABLE_KEY, 'false');
  }
};

const loadGlobalState = () => {
  const saved = localStorage.getItem(GLOBAL_DISABLE_KEY);
  if (saved === 'true') {
    isGlobalDisabled.value = true;
  }
};

// ==================== Core Functions ====================
const setProductRef = (el: any, code: string) => {
  if (el) productRefs.value.set(code, el);
};

const formatPriceValue = (num: number | null | undefined) => {
  if (num === null || num === undefined) return '';
  if (num === 0) return '';
  return formatNumber(num);
};

const formatDateTime = (date: string | Date) => {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tehran'
  });
};

const formatQuantity = (tx: any) => {
  let value = tx.coin_quantity || tx.melted_weight;
  if (value === null || value === undefined) return '۰';
  if (typeof value === 'number' || !isNaN(parseFloat(value))) {
    const num = parseFloat(value);
    if (num % 1 !== 0) {
      return num.toLocaleString('fa-IR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    }
    return formatNumber(num);
  }
  return formatNumber(parseFloat(value));
};

const parseNumber = (str: string) => {
  if (!str) return 0;
  const cleaned = toEnglishNumber(str).replace(/,/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};

const formatTime = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleTimeString('fa-IR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Asia/Tehran'
  });
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: 'در انتظار',
    approved: 'تأیید شده',
    rejected: 'رد شده',
    expired: 'منقضی شده'
  };
  return map[status] || status;
};

const getUserName = (tx: any) => {
  if (tx.user_info?.full_name) return tx.user_info.full_name;
  if (tx.user_info?.name) return tx.user_info.name;
  if (tx.user_name) return tx.user_name;
  if (tx.full_name) return tx.full_name;
  return 'کاربر';
};

const adjustQuick = (type: 'coin' | 'melted', delta: number) => {
  if (type === 'coin') {
    coinAdjustment.value = Math.max(0, coinAdjustment.value + delta);
  } else {
    meltedAdjustment.value = Math.max(0, meltedAdjustment.value + delta);
  }
};

const saving = (product: any, field: string) => {
  const key = `${product.code}_${field}`;
  return savingMap.value.get(key) || false;
};

const setSaving = (product: any, field: string, value: boolean) => {
  const key = `${product.code}_${field}`;
  savingMap.value.set(key, value);
  if (!value) {
    savedMap.value.set(product.code, true);
    setTimeout(() => savedMap.value.delete(product.code), 2000);
  }
};

const handleCoinAdjustment = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const val = parseNumber(target.value);
  coinAdjustment.value = val || 50000;
};

const handleMeltedAdjustment = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const val = parseNumber(target.value);
  meltedAdjustment.value = val || 50000;
};

const adjustPrice = async (product: any, field: string, operation: 'increase' | 'decrease') => {
  activeProductCode.value = product.code;
  isUpdatingPrices.value = true;
  
  const adjustment = product.type === 'melted' ? meltedAdjustment.value : coinAdjustment.value;
  let currentPrice = product[field];
  if (currentPrice === null || currentPrice === undefined) currentPrice = 0;
  
  let newPrice = operation === 'increase' ? currentPrice + adjustment : currentPrice - adjustment;
  if (newPrice < 0) newPrice = 0;
  
  product[field] = newPrice;
  await savePrice(product, field);
  
  if (field === 'buy_price' && getProductAutoSpread(product) && product.buy_price !== null && product.buy_price > 0) {
    const spreadValue = getProductSpreadValue(product);
    const newSellPrice = product.buy_price + spreadValue;
    if (product.sell_price !== newSellPrice) {
      product.sell_price = newSellPrice;
      await savePrice(product, 'sell_price');
    }
  }
  
  isUpdatingPrices.value = false;
};

const updatePrice = async (product: any, field: string, rawValue: string) => {
  activeProductCode.value = product.code;
  isUpdatingPrices.value = true;
  
  const value = parseNumber(rawValue);
  product[field] = value;
  await savePrice(product, field);
  
  if (field === 'buy_price' && getProductAutoSpread(product) && product.buy_price !== null && product.buy_price > 0) {
    const spreadValue = getProductSpreadValue(product);
    const newSellPrice = product.buy_price + spreadValue;
    if (product.sell_price !== newSellPrice) {
      product.sell_price = newSellPrice;
      await savePrice(product, 'sell_price');
    }
  }
  
  isUpdatingPrices.value = false;
};

const savePrice = async (product: any, field: string) => {
  if (saving(product, field)) return;
  setSaving(product, field, true);
  
  try {
    const data: any = {
      product_code: product.code,
      [field]: product[field]
    };
    await api.post('/prices', data);
    product.updated_at = new Date().toISOString();
  } catch (err) {
    console.error('Error saving price:', err);
  } finally {
    setSaving(product, field, false);
  }
};

const toggleVisibility = async (product: any, field: 'is_visible_buy' | 'is_visible_sell') => {
  activeProductCode.value = product.code;
  let newValue: boolean;
  
  if (isGlobalDisabled.value) {
    const saved = savedVisibilityState.value.get(product.code) || { buy: true, sell: true };
    newValue = !(field === 'is_visible_buy' ? saved.buy : saved.sell);
    if (field === 'is_visible_buy') {
      saved.buy = newValue;
    } else {
      saved.sell = newValue;
    }
    savedVisibilityState.value.set(product.code, saved);
    if (field === 'is_visible_buy') {
      product._temp_buy = newValue;
    } else {
      product._temp_sell = newValue;
    }
  } else {
    newValue = !product[field];
    product[field] = newValue;
    await saveVisibilityToServer(product, field, newValue);
    product.updated_at = new Date().toISOString();
  }
};

// ==================== Products Loading ====================
const loadProducts = async () => {
  if (isUpdatingPrices.value) return;
  loading.value = true;
  
  try {
    const response = await api.get('/prices/products');
    console.log('Products response:', response.data);
    
    if (response.data.success && response.data.data) {
      const products = [
        ...(response.data.data.melted || []),
        ...(response.data.data.coins || [])
      ];
      
      allProducts.value = products;
      
      products.forEach(product => {
        const key = getProductKey(product);
        const setting = productAutoSpread.value.get(key);
        if (setting) {
          product._autoSpreadEnabled = setting.enabled;
          product._autoSpreadValue = setting.value;
        } else {
          product._autoSpreadEnabled = false;
          product._autoSpreadValue = 50000;
        }
      });
      
      if (activeProductCode.value) {
        await nextTick();
        const activeElement = productRefs.value.get(activeProductCode.value);
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  } catch (err) {
    console.error('Error loading products:', err);
  } finally {
    loading.value = false;
  }
};

// ==================== Transactions Functions ====================
const loadTodayTransactions = async () => {
  txLoading.value = true;
  try {
    const response = await api.get('/transactions/admin/all?page=1&limit=100');
    if (response.data.success) {
      allTransactions.value = response.data.data || [];
      updateRemainingTimes();
    }
  } catch (err) {
    console.error('Error loading transactions:', err);
  } finally {
    txLoading.value = false;
  }
};

const approveTransaction = async (tx: any) => {
  txProcessing.value = true;
  try {
    await api.put(`/transactions/admin/${tx.id}/status`, { status: 'approved' });
    tx.status = 'approved';
  } catch (err) {
    console.error('Error approving transaction:', err);
  } finally {
    txProcessing.value = false;
  }
};

const rejectTransaction = async (tx: any) => {
  txProcessing.value = true;
  try {
    await api.put(`/transactions/admin/${tx.id}/status`, { status: 'rejected' });
    tx.status = 'rejected';
  } catch (err) {
    console.error('Error rejecting transaction:', err);
  } finally {
    txProcessing.value = false;
  }
};

const refreshPage = () => {
  activeProductCode.value = null;
  loadProducts();
  loadTodayTransactions();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ==================== Socket.IO ====================
const initSocket = () => {
  socket = connectSocket();
  
  socket.on('new_transaction', (tx: any) => {
    if (tx.status === 'pending') {
      const now = new Date();
      const createdAt = new Date(tx.created_at);
      const elapsed = Math.floor((now.getTime() - createdAt.getTime()) / 1000);
      tx.remaining_seconds = Math.max(0, timerTotal.value - elapsed);
    }
    allTransactions.value = [tx, ...allTransactions.value];
    updateRemainingTimes();
  });
  
  socket.on('transaction_update', (tx: any) => {
    const index = allTransactions.value.findIndex(t => t.id === tx.id);
    if (index !== -1) {
      allTransactions.value[index] = { ...allTransactions.value[index], ...tx };
      updateRemainingTimes();
    }
  });
  
  socket.on('transaction_expired', (data: any) => {
    const index = allTransactions.value.findIndex(t => t.id === data.transaction_id);
    if (index !== -1) {
      allTransactions.value[index].status = 'expired';
    }
  });
  
  socket.on('price_update', () => {
    if (!isUpdatingPrices.value) {
      loadProducts();
    }
  });
  
  socket.on('timer_updated', (data: any) => {
    timerTotal.value = data.value;
    updateRemainingTimes();
  });
};

// ==================== Lifecycle ====================
onMounted(async () => {
  loadGlobalState();
  loadProductAutoSpreadSettings();
  await loadTimerConfig();
  await loadProducts();
  await loadTodayTransactions();
  initSocket();
  startLocalTimer();
  
  refreshInterval = setInterval(() => {
    if (!isUpdatingPrices.value) {
      loadTodayTransactions();
    }
  }, 60000);
});

onUnmounted(() => {
  if (socket) {
    socket.off('new_transaction');
    socket.off('transaction_update');
    socket.off('transaction_expired');
    socket.off('price_update');
    socket.off('timer_updated');
  }
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  stopLocalTimer();
});
</script>

<style scoped>
/* ==================== استایل مودال ==================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 550px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.2s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  flex: 1;
}

.modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.modal-close:hover {
  opacity: 1;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 550px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

/* دکمه ثبت معامله دستی */
.manual-tx-btn {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s;
}

.manual-tx-btn:hover {
  transform: scale(1.02);
  filter: brightness(0.95);
}

/* فرم */
.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

.required {
  color: #e74c3c;
}

.form-input, .form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 0.9rem;
  transition: all 0.2s;
  background: white;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-group.half {
  flex: 1;
}

/* نوع معامله */
.type-selector {
  display: flex;
  gap: 12px;
}

.type-btn {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.type-btn.buy-type {
  color: #e74c3c;
}

.type-btn.sell-type {
  color: #27ae60;
}

.type-btn.active {
  border-color: currentColor;
  background: currentColor;
  color: white;
}

.type-btn.buy-type.active {
  background: #e74c3c;
  border-color: #e74c3c;
}

.type-btn.sell-type.active {
  background: #27ae60;
  border-color: #27ae60;
}

/* قیمت نمایش */
.price-display-group {
  background: #f0f2f5;
  padding: 10px 12px;
  border-radius: 10px;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
}

.calculated-price {
  font-size: 1.2rem;
  font-weight: 700;
  color: #27ae60;
  direction: ltr;
}

.price-note {
  font-size: 0.8rem;
  color: #999;
}

.field-hint {
  margin-top: 5px;
  font-size: 0.7rem;
  color: #f39c12;
}

/* جستجوی کاربر */
.user-search-wrapper {
  position: relative;
}

.user-search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-result-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: #f5f5f5;
}

.result-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.result-details {
  display: flex;
  gap: 12px;
  font-size: 0.7rem;
  color: #999;
}

.selected-user-info {
  background: #e8f5e9;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  background: #27ae60;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.user-info-details {
  flex: 1;
}

.user-name {
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.user-meta {
  display: flex;
  gap: 12px;
  font-size: 0.7rem;
  color: #666;
  flex-wrap: wrap;
}

.remove-user-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #e74c3c;
  padding: 0 8px;
}

.btn-cancel {
  background: #e9ecef;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #dee2e6;
}

.btn-submit {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  padding: 10px 28px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: scale(1.02);
  filter: brightness(0.95);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* بقیه استایل‌ها به همان صورت قبل */
.pricing-dashboard {
  min-height: 100vh;
  background: #f0f2f5;
  padding: 16px;
  direction: rtl;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title h1 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.header-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.refresh-btn {
  background: #f0f0f0;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s;
}

.refresh-btn:hover {
  background: #e0e0e0;
  transform: rotate(180deg);
}

.toggle-all-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.3s;
}

.toggle-all-btn.active {
  background: #dc3545;
}

.toggle-all-btn.active:hover {
  background: #c82333;
}

.toggle-all-btn:hover:not(.active) {
  background: #5a6268;
}

.two-column-layout {
  display: flex;
  gap: 16px;
  flex-direction: row;
}

.pricing-column {
  flex: 0 0 48%;
  min-width: 0;
}

.transactions-column {
  flex: 1;
  min-width: 0;
}

.card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 1.2rem;
}

.card-title h2 {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.pricing-card {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
}

.products-badge {
  background: #667eea;
  color: white;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.65rem;
}

.quick-adjust {
  padding: 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.adjust-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.adjust-row:last-child {
  margin-bottom: 0;
}

.adjust-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  width: 65px;
}

.adjust-input-wrapper {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
}

.quick-minus, .quick-plus {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.2s;
}

.quick-minus {
  background: #e74c3c;
  color: white;
}

.quick-plus {
  background: #27ae60;
  color: white;
}

.quick-minus:hover, .quick-plus:hover {
  transform: scale(1.02);
  filter: brightness(0.95);
}

.adjust-input {
  flex: 1;
  padding: 6px 8px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.adjust-input:focus {
  outline: none;
  border-color: #667eea;
}

.products-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.products-list.with-scroll {
  overflow-y: auto;
}

.products-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-category {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 10px;
}

.category-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 10px 0;
  padding-bottom: 6px;
  border-bottom: 2px solid #667eea;
  display: inline-block;
}

.category-products {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-card {
  background: white;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.2s;
}

.product-card:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.product-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.product-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.product-code {
  font-size: 0.65rem;
  color: #999;
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 12px;
}

.type-badge {
  font-size: 0.7rem;
  padding: 3px 10px;
  border-radius: 16px;
  font-weight: 600;
}

.type-badge.melted {
  background: #e8f5e9;
  color: #27ae60;
}

.type-badge.coin {
  background: #fff8e1;
  color: #f39c12;
}

.product-range {
  font-size: 0.7rem;
  color: #666;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
}

.prices-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.price-box {
  flex: 1;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 12px;
  min-width: 0;
}

.price-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.price-title {
  font-size: 0.8rem;
  font-weight: 700;
}

.buy-title {
  color: #27ae60;
}

.sell-title {
  color: #e74c3c;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 22px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #27ae60;
}

input:checked + .toggle-slider:before {
  transform: translateX(18px);
}

.price-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.price-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.price-btn.minus {
  background: #e74c3c;
  color: white;
}

.price-btn.plus {
  background: #27ae60;
  color: white;
}

.price-btn:hover {
  transform: scale(1.02);
  filter: brightness(0.95);
}

.price-input {
  flex: 1;
  padding: 8px 12px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  background: white;
  min-width: 140px;
}

.price-input:focus {
  outline: none;
  border-color: #667eea;
}

.price-input.price-zero {
  color: #999;
  background: #f8f9fa;
}

.price-status {
  text-align: center;
  font-size: 0.65rem;
  min-height: 18px;
}

.saving {
  color: #f39c12;
}

.saved {
  color: #27ae60;
}

/* بخش تراکنش‌ها */
.transactions-card {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
}

.pending-badge {
  background: #f39c12;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.filters-bar {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.filter-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.refresh-tx-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.refresh-tx-btn:hover {
  background: #5a67d8;
}

.transactions-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.transactions-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tx-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 14px;
  border-right: 4px solid;
}

.tx-pending {
  border-right-color: #f39c12;
  background: #fff8e1;
}

.tx-approved {
  border-right-color: #27ae60;
}

.tx-rejected {
  border-right-color: #e74c3c;
}

.tx-expired {
  border-right-color: #95a5a6;
  background: #f8f9fa;
  opacity: 0.7;
}

.tx-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tx-user {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 1rem;
  font-weight: 700;
  color: #333;
}

.user-code {
  font-size: 0.75rem;
  color: #999;
  margin-top: 2px;
}

.tx-time {
  font-size: 0.75rem;
  color: #999;
}

.tx-body {
  margin-bottom: 12px;
}

.tx-product {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.tx-product .product-name {
  font-weight: 700;
  font-size: 1rem;
  color: #333;
}

.type-buy-blue {
  color: #007bff;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 4px 12px;
  background: rgba(0, 123, 255, 0.1);
  border-radius: 20px;
}

.type-sell {
  color: #e74c3c;
  font-weight: 700;
  font-size: 0.9rem;
  padding: 4px 12px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 20px;
}

.tx-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.85rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.detail-label {
  color: #666;
  font-size: 0.8rem;
}

.detail-value {
  font-weight: 700;
  color: #333;
  font-size: 0.9rem;
}

.amount-value {
  color: #27ae60;
  font-size: 1rem;
}

.detail-unit {
  color: #999;
  font-size: 0.7rem;
}

.tx-footer {
  display: flex;
  justify-content: flex-end;
}

.timer-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f0f0;
  padding: 6px 12px;
  border-radius: 20px;
  font-family: monospace;
}

.timer-display.timer-warning {
  background: #fff3e0;
  color: #f39c12;
  animation: pulse 1s infinite;
}

.timer-icon {
  font-size: 14px;
}

.timer-value {
  font-size: 16px;
  font-weight: bold;
}

.timer-label {
  font-size: 11px;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.btn-approve, .btn-reject {
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-approve {
  background: #27ae60;
  color: white;
}

.btn-approve:hover {
  background: #219a52;
  transform: scale(1.02);
}

.btn-reject {
  background: #e74c3c;
  color: white;
}

.btn-reject:hover {
  background: #c0392b;
  transform: scale(1.02);
}

.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-pending {
  background: #fff3e0;
  color: #f39c12;
}

.status-approved {
  background: #e8f5e9;
  color: #27ae60;
}

.status-rejected {
  background: #ffebee;
  color: #e74c3c;
}

.status-expired {
  background: #e2e3e5;
  color: #6c757d;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.products-list::-webkit-scrollbar,
.transactions-list::-webkit-scrollbar {
  width: 5px;
}

.products-list::-webkit-scrollbar-track,
.transactions-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.products-list::-webkit-scrollbar-thumb,
.transactions-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.products-list::-webkit-scrollbar-thumb:hover,
.transactions-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e9ecef;
  font-size: 0.65rem;
  color: #999;
}

.auto-spread-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.auto-spread-footer-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 11px;
  color: #555;
}

.auto-spread-footer-label input {
  width: 14px;
  height: 14px;
  margin: 0;
  cursor: pointer;
}

.auto-spread-footer-text {
  font-weight: 500;
}

.auto-spread-footer-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.spread-footer-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 12px;
  transition: all 0.2s;
  background: #e9ecef;
  color: #333;
}

.spread-footer-btn:hover {
  background: #dee2e6;
  transform: scale(1.02);
}

.spread-footer-input {
  width: 70px;
  padding: 3px 4px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: white;
}

.spread-footer-input:focus {
  outline: none;
  border-color: #667eea;
}

.spread-footer-unit {
  font-size: 10px;
  color: #666;
}

@media (max-width: 1024px) {
  .two-column-layout {
    flex-direction: column;
  }
  
  .pricing-column {
    flex: auto;
  }
  
  .pricing-card, .transactions-card {
    height: auto;
    max-height: 500px;
  }
  
  .header-actions {
    flex-wrap: wrap;
  }
  
  .timer-section {
    flex-direction: column;
  }
  
  .product-footer {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .auto-spread-footer {
    flex-wrap: wrap;
  }
  
  .form-row {
    flex-direction: column;
    gap: 10px;
  }
}
</style>