<template>
  <div class="date-range-picker">
    <div class="range-group">
      <label>
        <span class="label-icon">📅</span>
        از تاریخ:
      </label>
      <PersianDatePicker 
        v-model="startDate"
        :placeholder="startPlaceholder"
        @update:modelValue="updateStartDate"
        :input-class="'range-picker-input'"
      />
    </div>
    <div class="range-separator">
      <span>تا</span>
    </div>
    <div class="range-group">
      <label>
        <span class="label-icon">📅</span>
        تا تاریخ:
      </label>
      <PersianDatePicker 
        v-model="endDate"
        :placeholder="endPlaceholder"
        @update:modelValue="updateEndDate"
        :input-class="'range-picker-input'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import PersianDatePicker from './PersianDatePicker.vue';

const props = defineProps({
  startValue: { type: String, default: '' },
  endValue: { type: String, default: '' },
  startPlaceholder: { type: String, default: 'انتخاب تاریخ شروع' },
  endPlaceholder: { type: String, default: 'انتخاب تاریخ پایان' }
});

const emit = defineEmits(['update:start', 'update:end']);

const startDate = ref(props.startValue);
const endDate = ref(props.endValue);

const updateStartDate = (value: string) => {
  startDate.value = value;
  emit('update:start', value);
};

const updateEndDate = (value: string) => {
  endDate.value = value;
  emit('update:end', value);
};

watch(() => props.startValue, (newVal) => {
  startDate.value = newVal;
});

watch(() => props.endValue, (newVal) => {
  endDate.value = newVal;
});
</script>

<style scoped>
.date-range-picker {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.range-group {
  flex: 1;
  min-width: 220px;
}

.range-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

.label-icon {
  font-size: 16px;
}

.range-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 12px;
  font-weight: 600;
  color: #667eea;
  font-size: 16px;
}

@media (max-width: 768px) {
  .date-range-picker {
    flex-direction: column;
    gap: 16px;
  }
  
  .range-separator {
    padding: 0;
    margin: -8px 0;
  }
}
</style>