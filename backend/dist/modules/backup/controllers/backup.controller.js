"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupController = exports.BackupController = void 0;
const backup_service_1 = require("../services/backup.service");
const excel_service_1 = require("../services/excel.service");
class BackupController {
    async downloadLiveExcel(req, res) {
        try {
            const { buffer, fileName } = await excel_service_1.excelService.generateLiveExcel();
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.send(buffer);
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async generateSqlBackup(req, res) {
        try {
            const adminId = req.user?.id || 1;
            const { start_date, end_date, tables } = req.body;
            const { filePath, fileName, totalRecords } = await backup_service_1.backupService.generateSqlBackup({ start_date, end_date, tables }, adminId);
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
                backup_service_1.backupService.cleanupTempFile(filePath);
            });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async getBackupHistory(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await backup_service_1.backupService.getBackupHistory(page, limit);
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
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
    async cleanupBackups(req, res) {
        try {
            const days = req.body.days || 30;
            const deletedCount = await backup_service_1.backupService.cleanupOldBackups(days);
            res.json({
                success: true,
                message: `${deletedCount} بکاپ قدیمی پاک شد`,
                deleted_count: deletedCount,
            });
        }
        catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}
exports.BackupController = BackupController;
exports.backupController = new BackupController();
