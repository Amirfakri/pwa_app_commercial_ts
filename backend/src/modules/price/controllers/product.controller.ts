import { Request, Response } from 'express';
import { AuthRequest } from '../../auth/middlewares/auth.middleware';
import { productService } from '../services/product.service';
import { priceService } from '../services/price.service';

export class ProductController {
  // اضافه کردن محصول جدید
  async createProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'احراز هویت نشده' });
        return;
      }

      const data = req.body;
      const newProduct = await productService.createProduct(data);
      
      const io = req.app.get('io');
      if (io) {
        const userId = req.user.id;
        const isAdmin = req.user.isAdmin;
        const allProducts = await priceService.getProductsWithPrices(userId, isAdmin);
        
        console.log('📢 Broadcasting product_added event');
        
        // ارسال بروزرسانی کامل به همه کاربران
        io.emit('products_full_update', {
          success: true,
          data: allProducts,
          timestamp: new Date().toISOString()
        });
        
        // ارسال رویداد محصول اضافه شده
        io.emit('product_added', {
          success: true,
          product: newProduct,
          all_products: allProducts,
          timestamp: new Date().toISOString()
        });
        
        io.to('admin_room').emit('admin_product_added', {
          success: true,
          product: newProduct,
          added_by: req.user.id,
          timestamp: new Date().toISOString()
        });
      }

      res.status(201).json({
        success: true,
        message: 'محصول با موفقیت اضافه شد',
        data: newProduct,
      });
    } catch (err: any) {
      console.error('خطا در اضافه کردن محصول:', err);
      res.status(500).json({ error: err.message || 'خطای سرور' });
    }
  }

  // به‌روزرسانی محصول (شامل فعال/غیرفعال و محدوده‌ها)
  async updateProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'احراز هویت نشده' });
        return;
      }

      const { code } = req.params;
      const data = req.body;
      
      console.log(`📢 Updating product ${code} with data:`, data);
      
      const updatedProduct = await productService.updateProduct(code, data);
      
      if (!updatedProduct) {
        res.status(404).json({ error: 'محصول یافت نشد' });
        return;
      }

      const io = req.app.get('io');
      if (io) {
        const userId = req.user.id;
        const isAdmin = req.user.isAdmin;
        const allProducts = await priceService.getProductsWithPrices(userId, isAdmin);
        
        console.log('📢 Broadcasting product_update event');
        
        // ارسال بروزرسانی محصول به همه کاربران
        io.emit('product_update', {
          product_code: code,
          name: data.name,
          display_name: data.display_name || data.default_display_name,
          is_active: data.is_active !== undefined ? data.is_active : (updatedProduct as any).is_active,
          min_weight: data.min_weight !== undefined ? parseFloat(data.min_weight) : (updatedProduct as any).min_weight,
          max_weight: data.max_weight !== undefined ? parseFloat(data.max_weight) : (updatedProduct as any).max_weight,
          min_count: data.min_count !== undefined ? parseInt(data.min_count) : (updatedProduct as any).min_count,
          max_count: data.max_count !== undefined ? parseInt(data.max_count) : (updatedProduct as any).max_count,
          type: code.startsWith('AB_') ? 'melted' : 'coin',
          timestamp: new Date().toISOString()
        });
        
        // ارسال بروزرسانی کامل به همه کاربران
        io.emit('products_full_update', {
          success: true,
          data: allProducts,
          timestamp: new Date().toISOString()
        });
        
        io.to('admin_room').emit('admin_product_update', {
          success: true,
          product: updatedProduct,
          updated_by: req.user.id,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'محصول با موفقیت به‌روزرسانی شد',
        data: updatedProduct,
      });
    } catch (err: any) {
      console.error('خطا در به‌روزرسانی محصول:', err);
      res.status(500).json({ error: err.message || 'خطای سرور' });
    }
  }

  // تغییر وضعیت فعال/غیرفعال محصول
  async toggleProductStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'احراز هویت نشده' });
        return;
      }

      const { code } = req.params;
      const { is_active } = req.body;
      
      console.log(`📢 Toggling product ${code} status to: ${is_active}`);
      
      const updatedProduct = await productService.updateProduct(code, { is_active });
      
      const io = req.app.get('io');
      if (io) {
        const userId = req.user.id;
        const isAdmin = req.user.isAdmin;
        const allProducts = await priceService.getProductsWithPrices(userId, isAdmin);
        
        console.log('📢 Broadcasting product_status_update event');
        
        // ارسال بروزرسانی وضعیت محصول به همه کاربران
        io.emit('product_status_update', {
          product_code: code,
          is_active: is_active,
          timestamp: new Date().toISOString()
        });
        
        // ارسال بروزرسانی کامل به همه کاربران
        io.emit('products_full_update', {
          success: true,
          data: allProducts,
          timestamp: new Date().toISOString()
        });
        
        io.to('admin_room').emit('admin_product_status_update', {
          success: true,
          product_code: code,
          is_active: is_active,
          updated_by: req.user.id,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: `محصول ${is_active ? 'فعال' : 'غیرفعال'} شد`,
        data: updatedProduct,
      });
    } catch (err: any) {
      console.error('خطا در تغییر وضعیت محصول:', err);
      res.status(500).json({ error: err.message || 'خطای سرور' });
    }
  }

  // حذف/غیرفعال کردن محصول
  async deleteProduct(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'احراز هویت نشده' });
        return;
      }

      const { code } = req.params;
      const deleted = await productService.deleteProduct(code);
      
      const io = req.app.get('io');
      if (io) {
        const userId = req.user.id;
        const isAdmin = req.user.isAdmin;
        const allProducts = await priceService.getProductsWithPrices(userId, isAdmin);
        
        console.log('📢 Broadcasting product_deleted event');
        
        io.emit('product_deleted', {
          success: true,
          product_code: code,
          all_products: allProducts,
          timestamp: new Date().toISOString()
        });
        
        io.emit('products_full_update', {
          success: true,
          data: allProducts,
          timestamp: new Date().toISOString()
        });
        
        io.to('admin_room').emit('admin_product_deleted', {
          success: true,
          product_code: code,
          deleted_by: req.user.id,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'محصول با موفقیت حذف شد',
        data: { product_code: code },
      });
    } catch (err: any) {
      console.error('خطا در حذف محصول:', err);
      res.status(500).json({ error: err.message || 'خطای سرور' });
    }
  }
}

export const productController = new ProductController();