import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// دریافت آدرس سرور از environment variables
const getSocketUrl = (): string => {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_WS_URL || window.location.origin;
  }
  return import.meta.env.VITE_WS_URL || 'http://localhost:5000';
};

// اتصال به سوکت
export const connectSocket = (): Socket => {
  if (socket && socket.connected) {
    reconnectAttempts = 0;
    return socket;
  }
  
  if (isConnecting) {
    return socket as Socket;
  }
  
  isConnecting = true;
  const WS_URL = getSocketUrl();
  
  socket = io(WS_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    isConnecting = false;
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      socket?.connect();
    }
  });

  socket.on('connect_error', () => {
    isConnecting = false;
    reconnectAttempts++;
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      socket?.close();
    }
  });

  socket.on('reconnect', () => {
    reconnectAttempts = 0;
  });

  return socket;
};

// قطع اتصال سوکت
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  isConnecting = false;
  reconnectAttempts = 0;
};

// دریافت نمونه سوکت
export const getSocket = (): Socket | null => socket;

// بررسی وضعیت اتصال
export const isSocketConnected = (): boolean => {
  return socket !== null && socket.connected;
};

// اتصال به روم کاربر
export const joinUserRoom = async (userId: number | string): Promise<void> => {
  const socketClient = connectSocket();
  
  if (socketClient.connected) {
    socketClient.emit('join-user', String(userId));
  } else {
    socketClient.once('connect', () => {
      socketClient.emit('join-user', String(userId));
    });
  }
};

// اتصال به روم ادمین
export const joinAdminRoom = async (): Promise<void> => {
  const socketClient = connectSocket();
  
  if (socketClient.connected) {
    socketClient.emit('join-admin');
  } else {
    socketClient.once('connect', () => {
      socketClient.emit('join-admin');
    });
  }
};

// ارسال رویداد سفارشی
export const emitEvent = (eventName: string, data: any): void => {
  const socketClient = connectSocket();
  if (socketClient.connected) {
    socketClient.emit(eventName, data);
  } else {
    socketClient.once('connect', () => {
      socketClient.emit(eventName, data);
    });
  }
};

// دریافت قیمت‌های اولیه
export const getInitialPrices = (callback?: (data: any) => void): void => {
  const socketClient = connectSocket();
  
  if (callback) {
    socketClient.on('initial_prices', callback);
  }
  
  if (socketClient.connected) {
    socketClient.emit('get_initial_prices');
  } else {
    socketClient.once('connect', () => {
      socketClient.emit('get_initial_prices');
    });
  }
};

// تنظیم listener برای price_update
export const onPriceUpdate = (callback: (data: any) => void): void => {
  const socketClient = connectSocket();
  socketClient.on('price_update', callback);
};

// تنظیم listener برای initial_prices
export const onInitialPrices = (callback: (data: any) => void): void => {
  const socketClient = connectSocket();
  socketClient.on('initial_prices', callback);
};

// تنظیم listener برای products_full_update
export const onProductsFullUpdate = (callback: (data: any) => void): void => {
  const socketClient = connectSocket();
  socketClient.on('products_full_update', callback);
};

// تنظیم listener برای product_update
export const onProductUpdate = (callback: (data: any) => void): void => {
  const socketClient = connectSocket();
  socketClient.on('product_update', callback);
};

// تنظیم listener برای product_status_update
export const onProductStatusUpdate = (callback: (data: any) => void): void => {
  const socketClient = connectSocket();
  socketClient.on('product_status_update', callback);
};

// تنظیم listener برای product_added
export const onProductAdded = (callback: (data: any) => void): void => {
  const socketClient = connectSocket();
  socketClient.on('product_added', callback);
};

// تنظیم listener برای product_deleted
export const onProductDeleted = (callback: (data: any) => void): void => {
  const socketClient = connectSocket();
  socketClient.on('product_deleted', callback);
};

// تنظیم listener برای transaction_update
export const onTransactionUpdate = (callback: (data: any) => void): void => {
  const socketClient = connectSocket();
  socketClient.on('transaction_update', callback);
};

// تنظیم listener برای balance_update
export const onBalanceUpdate = (callback: (data: any) => void): void => {
  const socketClient = connectSocket();
  socketClient.on('balance_update', callback);
};

// تنظیم listener برای timer_updated
export const onTimerUpdated = (callback: (data: any) => void): void => {
  const socketClient = connectSocket();
  socketClient.on('timer_updated', callback);
};

// ============== توابع مربوط به Remittance (حواله) ==============

// تنظیم listener برای new_remittance (حواله جدید)
export const onNewRemittance = (callback: (data: any) => void): void => {
  const socketClient = connectSocket();
  socketClient.on('new_remittance', callback);
};

// تنظیم listener برای remittance_status_update (به‌روزرسانی وضعیت حواله)
export const onRemittanceStatusUpdate = (callback: (data: any) => void): void => {
  const socketClient = connectSocket();
  socketClient.on('remittance_status_update', callback);
};

// حذف listener جدید_remittance
export const offNewRemittance = (callback?: (data: any) => void): void => {
  if (socket) {
    if (callback) {
      socket.off('new_remittance', callback);
    } else {
      socket.off('new_remittance');
    }
  }
};

// حذف listener remittance_status_update
export const offRemittanceStatusUpdate = (callback?: (data: any) => void): void => {
  if (socket) {
    if (callback) {
      socket.off('remittance_status_update', callback);
    } else {
      socket.off('remittance_status_update');
    }
  }
};

// ============== توابع کمکی برای حذف لیسنرها ==============

// حذف یک listener خاص
export const offEvent = (eventName: string, callback?: (...args: any[]) => void): void => {
  if (socket) {
    if (callback) {
      socket.off(eventName, callback);
    } else {
      socket.off(eventName);
    }
  }
};

// حذف همه لیسنرها
export const offAllEvents = (): void => {
  if (socket) {
    const events = [
      'initial_prices',
      'price_update',
      'products_full_update',
      'product_added',
      'product_deleted',
      'product_update',
      'product_status_update',
      'new_remittance',
      'remittance_status_update',
      'transaction_update',
      'balance_update',
      'timer_updated'
    ];
    events.forEach(event => {
      socket?.off(event);
    });
  }
};