import moment from 'moment-timezone';
import { transactionRepository } from '../repositories/transaction.repository';
import { priceRepository } from '../../price/repositories/price.repository';
import { productRepository } from '../../price/repositories/product.repository';
import { ICreateTransactionInput } from '../repositories/transaction.repository';

export class TransactionService {
  private getIranTimeString(): string {
    return moment().tz('Asia/Tehran').format('YYYY-MM-DD HH:mm:ss');
  }

  private detectProductType(productCode: string): 'melted' | 'coin' {
    if (productCode.startsWith('AB_')) return 'melted';
    if (productCode.startsWith('COIN_')) return 'coin';
    throw new Error('کد محصول نامعتبر است');
  }

  async getUserOffsets(userId: number, isAdmin: boolean = false): Promise<{ meltedOffset: number; coinOffset: number }> {
    if (isAdmin) {
      return { meltedOffset: 0, coinOffset: 0 };
    }

    const { rows } = await transactionRepository['pool'].query(
      'SELECT melted_price_offset, coin_price_offset FROM users WHERE id = $1',
      [userId]
    );
    
    if (rows.length === 0) {
      return { meltedOffset: 0, coinOffset: 0 };
    }

    return {
      meltedOffset: parseFloat(rows[0].melted_price_offset) || 0,
      coinOffset: parseFloat(rows[0].coin_price_offset) || 0,
    };
  }

  async createTransaction(
    userId: number,
    isAdmin: boolean,
    input: {
      product_code: string;
      type: 'buy' | 'sell' | 'خرید' | 'فروش';
      coin_quantity?: number;
      melted_weight?: number;
      amount: number;
    }
  ): Promise<any> {
    // تبدیل نوع به فارسی
    let persianType: 'خرید' | 'فروش';
    if (input.type === 'buy' || input.type === 'خرید') {
      persianType = 'خرید';
    } else {
      persianType = 'فروش';
    }

    const productType = this.detectProductType(input.product_code);
    const timerSeconds = await transactionRepository.getTimer();

    // دریافت آخرین قیمت
    const today = moment().tz('Asia/Tehran').format('YYYY-MM-DD');
    const priceData = await priceRepository.getTodayPrice(input.product_code, today);
    
    if (!priceData) {
      throw new Error('قیمت برای محصول یافت نشد');
    }

    // بررسی فعال بودن قیمت برای نوع معامله
    if (persianType === 'خرید' && !priceData.is_visible_sell) {
      throw new Error('خرید این محصول در حال حاضر غیرفعال است');
    }
    if (persianType === 'فروش' && !priceData.is_visible_buy) {
      throw new Error('فروش این محصول در حال حاضر غیرفعال است');
    }

    // دریافت افست کاربر
    const { meltedOffset, coinOffset } = await this.getUserOffsets(userId, isAdmin);
    const appliedOffset = productType === 'melted' ? meltedOffset : coinOffset;
    const offsetType = productType;

    // محاسبه قیمت پایه و نهایی
    let basePrice: number | null = null;
    if (persianType === 'خرید') {
      basePrice = priceData.sell_price ? parseFloat(priceData.sell_price as any) : null;
    } else {
      basePrice = priceData.buy_price ? parseFloat(priceData.buy_price as any) : null;
    }

    if (basePrice === null || basePrice <= 0) {
      throw new Error('قیمت معتبر برای نوع معامله یافت نشد');
    }

    // قیمت نهایی با توجه به نوع معامله و افست
    let finalPrice: number;
    if (persianType === 'خرید') {
      finalPrice = basePrice + appliedOffset;
    } else {
      finalPrice = basePrice - appliedOffset;
    }

    if (finalPrice <= 0) {
      throw new Error('قیمت نهایی نامعتبر است');
    }

    // اعتبارسنجی مقادیر ورودی
    let parsedCoinQuantity: number | null = null;
    let parsedMeltedWeight: number | null = null;
    const parsedAmount = Math.floor(input.amount);

    // بررسی محدودیت‌های محصول
    if (productType === 'melted') {
      if (!input.melted_weight || input.melted_weight <= 0) {
        throw new Error('وزن باید یک عدد مثبت باشد');
      }
      parsedMeltedWeight = input.melted_weight;
      
      const product = await productRepository.getMeltedProductByCode(input.product_code);
      if (product) {
        if (parsedMeltedWeight < product.min_weight || parsedMeltedWeight > product.max_weight) {
          throw new Error(`وزن باید بین ${product.min_weight} تا ${product.max_weight} گرم باشد`);
        }
      }
    } else {
      if (!input.coin_quantity || input.coin_quantity <= 0) {
        throw new Error('تعداد سکه باید یک عدد صحیح مثبت باشد');
      }
      parsedCoinQuantity = input.coin_quantity;
      
      const product = await productRepository.getCoinProductByCode(input.product_code);
      if (product) {
        if (parsedCoinQuantity < product.min_count || parsedCoinQuantity > product.max_count) {
          throw new Error(`تعداد باید بین ${product.min_count} تا ${product.max_count} عدد باشد`);
        }
      }
    }

    if (parsedAmount <= 0) {
      throw new Error('مبلغ باید یک عدد مثبت باشد');
    }

    // ایجاد تراکنش
    const now = this.getIranTimeString();
    const transactionData: ICreateTransactionInput = {
      user_id: userId,
      price_id: priceData.id,
      product_code: input.product_code,
      display_name: priceData.display_name || input.product_code,
      type: persianType,
      coin_quantity: parsedCoinQuantity,
      melted_weight: parsedMeltedWeight,
      amount: parsedAmount,
      transaction_price: finalPrice,
      base_price: basePrice,
      applied_offset: appliedOffset,
      user_melted_offset: meltedOffset,
      user_coin_offset: coinOffset,
      offset_type: offsetType,
      status: 'pending',
      created_at: now,
    };

    const transaction = await transactionRepository.create(transactionData);

    // محاسبه زمان باقیمانده با استفاده از تایمر داینامیک
    const createdAt = moment(transaction.created_at);
    const nowMoment = moment();
    const elapsedSeconds = nowMoment.diff(createdAt, 'seconds');
    const remainingSeconds = Math.max(0, timerSeconds - elapsedSeconds);

    return {
      id: transaction.id,
      user_id: transaction.user_id,
      product_code: transaction.product_code,
      display_name: transaction.display_name,
      type: transaction.type,
      coin_quantity: transaction.coin_quantity,
      melted_weight: transaction.melted_weight,
      amount: transaction.amount,
      transaction_price: transaction.transaction_price,
      base_price: transaction.base_price,
      applied_offset: transaction.applied_offset,
      status: transaction.status,
      created_at: transaction.created_at,
      remaining_seconds: remainingSeconds,
      timer_total: timerSeconds,
      offset_info: {
        base_price: basePrice,
        applied_offset: appliedOffset,
        final_price: finalPrice,
        offset_type: offsetType,
        calculation: persianType === 'خرید' 
          ? `${basePrice} + ${appliedOffset} = ${finalPrice}`
          : `${basePrice} - ${appliedOffset} = ${finalPrice}`
      }
    };
  }

  async updateTransactionStatus(
    transactionId: number,
    status: 'approved' | 'rejected'
  ): Promise<any | null> {
    const transaction = await transactionRepository.findPendingById(transactionId);
    if (!transaction) {
      return null;
    }

    const now = this.getIranTimeString();
    const updated = await transactionRepository.updateStatus(transactionId, status, now);
    
    if (!updated) {
      return null;
    }

    return {
      id: updated.id,
      user_id: updated.user_id,
      product_code: updated.product_code,
      display_name: updated.display_name,
      type: updated.type,
      amount: updated.amount,
      transaction_price: updated.transaction_price,
      coin_quantity: updated.coin_quantity,
      melted_weight: updated.melted_weight,
      status: updated.status,
      created_at: updated.created_at,
      updated_at: updated.updated_at
    };
  }

  async getUserTransactions(userId: number, status?: string, page: number = 1, limit: number = 50): Promise<any> {
    const offset = (page - 1) * limit;
    const transactions = await transactionRepository.getUserTransactions(userId, status, limit, offset);
    const total = await transactionRepository.getUserTransactionsCount(userId, status);
    const timerSeconds = await transactionRepository.getTimer();
    
    const formattedTransactions = transactions.map((tx: any) => {
      let remainingSeconds = null;
      if (tx.status === 'pending') {
        const createdAt = moment(tx.created_at);
        const now = moment();
        const elapsedSeconds = now.diff(createdAt, 'seconds');
        remainingSeconds = Math.max(0, timerSeconds - elapsedSeconds);
      }
      
      return {
        id: tx.id,
        product_code: tx.product_code,
        display_name: tx.display_name,
        type: tx.type,
        coin_quantity: tx.coin_quantity ? parseInt(tx.coin_quantity) : null,
        melted_weight: tx.melted_weight ? parseFloat(tx.melted_weight) : null,
        amount: parseInt(tx.amount) || 0,
        transaction_price: tx.transaction_price ? parseFloat(tx.transaction_price) : null,
        base_price: tx.base_price ? parseFloat(tx.base_price) : null,
        applied_offset: tx.applied_offset ? parseFloat(tx.applied_offset) : 0,
        status: tx.status,
        created_at: tx.created_at,
        remaining_seconds: remainingSeconds,
        timer_total: tx.status === 'pending' ? timerSeconds : null
      };
    });
    
    return {
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // متد جدید برای دریافت تراکنش‌ها در بازه زمانی
  async getUserTransactionsByDateRange(
    userId: number,
    startDate: string,
    endDate: string,
    status?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<any> {
    const offset = (page - 1) * limit;
    const timerSeconds = await transactionRepository.getTimer();
    
    // کوئری برای دریافت تراکنش‌های بازه زمانی
    let query = `
      SELECT * FROM transactions 
      WHERE user_id = $1 AND DATE(created_at) BETWEEN $2 AND $3
    `;
    const params: any[] = [userId, startDate, endDate];
    let paramIndex = 4;
    
    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);
    
    const { rows: transactions } = await transactionRepository['pool'].query(query, params);
    
    // کوئری برای شمارش کل تراکنش‌های بازه زمانی
    let countQuery = `
      SELECT COUNT(*) as total FROM transactions 
      WHERE user_id = $1 AND DATE(created_at) BETWEEN $2 AND $3
    `;
    const countParams: any[] = [userId, startDate, endDate];
    let countIndex = 4;
    
    if (status) {
      countQuery += ` AND status = $${countIndex++}`;
      countParams.push(status);
    }
    
    const countResult = await transactionRepository['pool'].query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.total || '0');
    
    const formattedTransactions = transactions.map((tx: any) => {
      let remainingSeconds = null;
      if (tx.status === 'pending') {
        const createdAt = moment(tx.created_at);
        const now = moment();
        const elapsedSeconds = now.diff(createdAt, 'seconds');
        remainingSeconds = Math.max(0, timerSeconds - elapsedSeconds);
      }
      
      return {
        id: tx.id,
        product_code: tx.product_code,
        display_name: tx.display_name,
        type: tx.type,
        coin_quantity: tx.coin_quantity ? parseInt(tx.coin_quantity) : null,
        melted_weight: tx.melted_weight ? parseFloat(tx.melted_weight) : null,
        amount: parseInt(tx.amount) || 0,
        transaction_price: tx.transaction_price ? parseFloat(tx.transaction_price) : null,
        base_price: tx.base_price ? parseFloat(tx.base_price) : null,
        applied_offset: tx.applied_offset ? parseFloat(tx.applied_offset) : 0,
        status: tx.status,
        created_at: tx.created_at,
        remaining_seconds: remainingSeconds,
        timer_total: tx.status === 'pending' ? timerSeconds : null
      };
    });
    
    return {
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // متد برای دریافت تراکنش‌های یک تاریخ خاص (با استفاده از متد بازه زمانی)
  async getUserTransactionsByDate(
    userId: number, 
    date: string, 
    status?: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<any> {
    return this.getUserTransactionsByDateRange(userId, date, date, status, page, limit);
  }

  // دریافت تراکنش‌های در انتظار کاربر (با بررسی و به‌روزرسانی وضعیت منقضی شده)
  async getUserPendingTransactions(userId: number): Promise<any[]> {
    const transactions = await transactionRepository.getUserTransactions(userId, 'pending', 100, 0);
    const timerSeconds = await transactionRepository.getTimer();
    const now = moment().tz('Asia/Tehran');
    const nowString = this.getIranTimeString();
    
    const result = [];
    const expiredIds = [];
    
    for (const tx of transactions) {
      const createdAt = moment(tx.created_at).tz('Asia/Tehran');
      const elapsedSeconds = now.diff(createdAt, 'seconds');
      const remainingSeconds = Math.max(0, timerSeconds - elapsedSeconds);
      
      // اگر زمان باقیمانده صفر است و وضعیت pending است، آن را منقضی کن
      if (remainingSeconds === 0) {
        expiredIds.push(tx.id);
        result.push({
          id: tx.id,
          user_id: tx.user_id,
          product_code: tx.product_code,
          display_name: tx.display_name,
          type: tx.type,
          coin_quantity: tx.coin_quantity,
          melted_weight: tx.melted_weight,
          amount: tx.amount,
          transaction_price: tx.transaction_price,
          status: 'expired',
          created_at: tx.created_at,
          remaining_seconds: 0,
          timer_total: timerSeconds
        });
      } else {
        result.push({
          id: tx.id,
          user_id: tx.user_id,
          product_code: tx.product_code,
          display_name: tx.display_name,
          type: tx.type,
          coin_quantity: tx.coin_quantity,
          melted_weight: tx.melted_weight,
          amount: tx.amount,
          transaction_price: tx.transaction_price,
          status: tx.status,
          created_at: tx.created_at,
          remaining_seconds: remainingSeconds,
          timer_total: timerSeconds
        });
      }
    }
    
    // به‌روزرسانی تراکنش‌های منقضی شده در دیتابیس
    for (const id of expiredIds) {
      await transactionRepository.expireTransactionById(id, nowString);
    }
    
    return result;
  }

  async getPendingCount(): Promise<number> {
    return transactionRepository.getPendingCount();
  }

  async getTimer(): Promise<number> {
    return transactionRepository.getTimer();
  }

  async updateTimer(value: number): Promise<void> {
    if (value < 5 || value > 300) {
      throw new Error('تایمر باید بین ۵ تا ۳۰۰ ثانیه باشد');
    }
    await transactionRepository.updateTimer(value);
  }

  // متد انقضای خودکار تراکنش‌های در انتظار (برای Cron Job)
  async autoExpirePendingTransactions(io: any): Promise<any[]> {
    const timerSeconds = await transactionRepository.getTimer();
    const now = this.getIranTimeString();
    
    // پیدا کردن و منقضی کردن تراکنش‌های قدیمی
    const expiredTransactions = await transactionRepository.expireOldTransactions(now, timerSeconds);
    
    for (const transaction of expiredTransactions) {
      
      
      const expiredData = {
        id: transaction.id,
        user_id: transaction.user_id,
        product_code: transaction.product_code,
        display_name: transaction.display_name,
        type: transaction.type,
        amount: transaction.amount,
        transaction_price: transaction.transaction_price,
        coin_quantity: transaction.coin_quantity,
        melted_weight: transaction.melted_weight,
        status: 'expired',
        created_at: transaction.created_at,
        updated_at: now
      };
      
      // ارسال رویداد Socket.IO به کاربر
      if (io) {
        io.to(`user_${transaction.user_id}`).emit('transaction_expired', expiredData);
        io.to('admin_room').emit('transaction_expired', expiredData);
      
      }
    }
    
    if (expiredTransactions.length > 0) {
     
    }
    
    return expiredTransactions;
  }

  async expireTransaction(transactionId: number): Promise<any | null> {
    const transaction = await transactionRepository.findPendingById(transactionId);
    if (!transaction) {
      return null;
    }

    const now = this.getIranTimeString();
    const updated = await transactionRepository.expireTransactionById(transactionId, now);
    
    if (!updated) {
      return null;
    }

    return {
      id: updated.id,
      user_id: updated.user_id,
      product_code: updated.product_code,
      display_name: updated.display_name,
      type: updated.type,
      amount: updated.amount,
      transaction_price: updated.transaction_price,
      coin_quantity: updated.coin_quantity,
      melted_weight: updated.melted_weight,
      status: updated.status,
      created_at: updated.created_at,
      updated_at: updated.updated_at
    };
  }

  async getPendingTransactions(): Promise<any[]> {
    const transactions = await transactionRepository.getPendingTransactions();
    const timerSeconds = await transactionRepository.getTimer();
    
    return transactions.map((tx: any) => {
      const createdAt = moment(tx.created_at);
      const now = moment();
      const elapsedSeconds = now.diff(createdAt, 'seconds');
      const remainingSeconds = Math.max(0, timerSeconds - elapsedSeconds);
      
      return {
        id: tx.id,
        user_id: tx.user_id,
        product_code: tx.product_code,
        display_name: tx.display_name,
        type: tx.type,
        amount: tx.amount,
        transaction_price: tx.transaction_price,
        coin_quantity: tx.coin_quantity,
        melted_weight: tx.melted_weight,
        status: tx.status,
        created_at: tx.created_at,
        remaining_seconds: remainingSeconds,
        timer_total: timerSeconds
      };
    });
  }

  async getAllTransactions(status?: string, page: number = 1, limit: number = 50): Promise<any> {
    const offset = (page - 1) * limit;
    const transactions = await transactionRepository.getAllTransactions(status, limit, offset);
    const total = await transactionRepository.getTotalCount(status);
    const timerSeconds = await transactionRepository.getTimer();
    
    const formattedTransactions = await Promise.all(transactions.map(async (tx: any) => {
      const userResult = await transactionRepository['pool'].query(
        `SELECT first_name, last_name, code, mobile_number FROM users WHERE id = $1`,
        [tx.user_id]
      );
      const user = userResult.rows[0];
      
      let remainingSeconds = null;
      if (tx.status === 'pending') {
        const createdAt = moment(tx.created_at);
        const now = moment();
        const elapsedSeconds = now.diff(createdAt, 'seconds');
        remainingSeconds = Math.max(0, timerSeconds - elapsedSeconds);
      }
      
      return {
        id: tx.id,
        user_id: tx.user_id,
        user_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.code || 'کاربر' : 'کاربر',
        user_code: user?.code || '-',
        user_mobile: user?.mobile_number || '-',
        product_code: tx.product_code,
        display_name: tx.display_name,
        type: tx.type,
        coin_quantity: tx.coin_quantity,
        melted_weight: tx.melted_weight,
        amount: tx.amount,
        transaction_price: tx.transaction_price,
        status: tx.status,
        created_at: tx.created_at,
        remaining_seconds: remainingSeconds,
        timer_total: tx.status === 'pending' ? timerSeconds : null
      };
    }));
    
    return {
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

export const transactionService = new TransactionService();