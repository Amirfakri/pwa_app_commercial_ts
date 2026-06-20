// backend/src/modules/support/controllers/terms.controller.ts

import { Response } from 'express';
import { AuthRequest } from '../../auth/middlewares/auth.middleware';
import { termsService } from '../services/terms.service';
import { ICreateTermsInput } from '../types/support.types';

export class TermsController {
  async getActiveTerms(req: AuthRequest, res: Response): Promise<void> {
    try {
      let terms = await termsService.getActiveTerms();
      
      if (!terms) {
        terms = await termsService.getInitialTerms();
      }

      res.json({
        success: true,
        data: {
          id: terms.id,
          content: terms.content,
          version: terms.version,
          created_at: terms.created_at,
          updated_at: terms.updated_at,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'خطای سرور',
      });
    }
  }

  async getTermsHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await termsService.getAllVersions(page, limit);

      res.json({
        success: true,
        data: result.terms,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'خطای سرور',
      });
    }
  }

  async createTerms(req: AuthRequest, res: Response): Promise<void> {
    try {
      const data: ICreateTermsInput = req.body;
      const terms = await termsService.createTerms(data, req.user!.id);

      const io = req.app.get('io');
      if (io) {
        io.emit('terms_updated', {
          id: terms.id,
          version: terms.version,
          updated_at: terms.updated_at,
        });
      }

      res.status(201).json({
        success: true,
        message: 'شرایط و قوانین با موفقیت ایجاد شد',
        data: {
          id: terms.id,
          content: terms.content,
          version: terms.version,
          created_at: terms.created_at,
          updated_at: terms.updated_at,
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'خطای سرور در ایجاد شرایط و قوانین',
      });
    }
  }

  async acceptTerms(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await termsService.acceptTerms(userId);

      res.json({
        success: true,
        message: result.message,
        needsRedirect: result.needsRedirect,
      });
    } catch (err: any) {
      res.json({
        success: true,
        message: 'پذیرش شرایط ثبت شد',
        needsRedirect: true,
      });
    }
  }

  async checkAcceptance(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const acceptanceStatus = await termsService.checkUserAcceptance(userId);

      res.json({
        success: true,
        data: acceptanceStatus,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'خطای سرور',
      });
    }
  }
}

export const termsController = new TermsController();