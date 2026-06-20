<template>
  <div class="persian-date-picker">
    <Vue3PersianDateTimePicker 
      :value="modelValue"
      @update:value="updateValue"
      :config="finalConfig"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="['custom-date-picker', inputClass]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Vue3PersianDateTimePicker from 'vue3-persian-datetime-picker';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'انتخاب تاریخ و زمان'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  inputClass: {
    type: String,
    default: ''
  },
  enableTime: {
    type: Boolean,
    default: false
  },
  hour24: {
    type: Boolean,
    default: true
  },
  format: {
    type: String,
    default: 'YYYY-MM-DD'
  },
  clearable: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue']);

const updateValue = (value: string) => {
  emit('update:modelValue', value);
};

const finalConfig = computed(() => ({
  time: props.enableTime,
  hour24: props.hour24,
  format: props.format,
  clearable: props.clearable,
  locale: 'fa',
  autoClose: true,
  closeOnSelect: true,
  closeOnSelectTime: true,
  position: 'auto'
}));
</script>

<style scoped>
.persian-date-picker {
  width: 100%;
  position: relative;
}

:deep(.vpd-picker) {
  width: 100%;
  font-family: inherit;
}

:deep(.vpd-input) {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  color: #333;
}

:deep(.vpd-input:hover) {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

:deep(.vpd-input:focus) {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

:deep(.vpd-header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px;
}

:deep(.vpd-header .vpd-header-title) {
  color: white;
  font-weight: 600;
  font-size: 16px;
}

:deep(.vpd-header .vpd-header-action) {
  color: white;
}

:deep(.vpd-body) {
  padding: 16px;
}

:deep(.vpd-body .vpd-weekdays span) {
  color: #667eea;
  font-weight: 600;
}

:deep(.vpd-body .vpd-cell) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

:deep(.vpd-body .vpd-cell:hover) {
  background: #f0f0f0;
  transform: scale(1.05);
}

:deep(.vpd-body .vpd-cell.selected) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

:deep(.vpd-body .vpd-cell.today) {
  border: 2px solid #667eea;
  color: #667eea;
  font-weight: 600;
}

:deep(.vpd-footer) {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

:deep(.vpd-footer button) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.vpd-footer button:hover) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

:deep(.vpd-footer .vpd-clear-btn) {
  background: #f0f0f0;
  color: #666;
}

:deep(.vpd-footer .vpd-clear-btn:hover) {
  background: #e0e0e0;
}

/* Custom class for range picker */
.custom-date-picker.range-picker-input :deep(.vpd-input) {
  background: #f8f9fa;
  border-color: #e0e0e0;
}

.custom-date-picker.range-picker-input :deep(.vpd-input:focus) {
  background: white;
  border-color: #667eea;
}

/* Animation for calendar popup */
:deep(.vpd-picker-popup) {
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  :deep(.vpd-input) {
    padding: 10px 14px;
    font-size: 13px;
  }
  
  :deep(.vpd-body .vpd-cell) {
    padding: 8px;
    font-size: 12px;
  }
}
</style>