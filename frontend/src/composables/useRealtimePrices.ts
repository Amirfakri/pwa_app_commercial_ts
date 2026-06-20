import { ref, onUnmounted } from 'vue';
import { connectSocket, getSocket } from '@/core/socket/socket.io';

export function useRealtimePrices() {
  const realtimePrices = ref<Record<string, any>>({});
  let socket = getSocket();

  const connect = () => {
    if (!socket || !socket.connected) {
      socket = connectSocket();
    }

    // گوش دادن به رویداد به‌روزرسانی قیمت
    socket.on('price_update', (data: any) => {
      console.log('📡 Real-time price update:', data);
      
      // به‌روزرسانی قیمت محصول خاص
      if (data.product_code) {
        realtimePrices.value[data.product_code] = {
          buy_price: data.buy_price,
          sell_price: data.sell_price,
          is_visible_buy: data.is_visible_buy,
          is_visible_sell: data.is_visible_sell,
          display_name: data.display_name,
          updated_at: new Date().toISOString()
        };
      }
      
      // اگر همه قیمت‌ها آپدیت شدند
      if (data.type === 'all_prices' && data.prices) {
        Object.keys(data.prices).forEach(code => {
          realtimePrices.value[code] = {
            ...realtimePrices.value[code],
            ...data.prices[code]
          };
        });
      }
    });

    // گوش دادن به رویداد قیمت شخصی‌سازی شده (با افست)
    socket.on('price_update_personalized', (data: any) => {
      console.log('📡 Personalized price update:', data);
      if (data.product_code) {
        realtimePrices.value[data.product_code] = {
          ...realtimePrices.value[data.product_code],
          buy_price: data.buy_with_offset,
          sell_price: data.sell_with_offset,
          applied_offset: data.applied_offset,
          is_personalized: true
        };
      }
    });
  };

  const disconnect = () => {
    if (socket) {
      socket.off('price_update');
      socket.off('price_update_personalized');
    }
  };

  // اتصال خودکار
  connect();

  // قطع اتصال هنگام unmount
  onUnmounted(() => {
    disconnect();
  });

  return {
    realtimePrices,
    connect,
    disconnect
  };
}