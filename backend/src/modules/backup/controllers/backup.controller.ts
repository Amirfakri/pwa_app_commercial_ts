import { Request, Response } from 'express';
import { backupService } from '../services/backup.service';
import { excelService } from '../services/excel.service';

export class BackupController {
  async downloadLiveExcel(req: Request, res: Response): Promise<void> {
    try {
      const { buffer, fileName } = await excelService.generateLiveExcel();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async generateSqlBackup(req: Request, res: Response): Promise<void> {
    try {
      const adminId = (req as any).user?.id || 1;
      const { start_date, end_date, tables } = req.body;

      const { filePath, fileName, totalRecords } = await backupService.generateSqlBackup(
        { start_date, end_date, tables },
        adminId
      );

      const io = req.app.get('io');
      if (io) {
        io.emit('backup_completed', {
          file_name: fileName,
          record_count: totalRecords,
          timestamp: new Date().toISOString()
        });
      }

      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

      const fs = require('fs');
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);

      readStream.on('end', () => {
        backupService.cleanupTempFile(filePath);
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getBackupHistory(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await backupService.getBackupHistory(page, limit);

      res.json({
        success: true,
        data: result.logs,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async cleanupBackups(req: Request, res: Response): Promise<void> {
    try {
      const days = req.body.days || 30;
      const deletedCount = await backupService.cleanupOldBackups(days);

      res.json({
        success: true,
        message: `${deletedCount} بکاپ قدیمی پاک شد`,
        deleted_count: deletedCount,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const backupController = new BackupController();