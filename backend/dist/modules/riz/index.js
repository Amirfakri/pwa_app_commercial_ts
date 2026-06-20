"use strict";
// ============================================
// 6. فایل ایندکس - backend/src/modules/riz/index.ts
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rizRepository = exports.rizService = exports.rizRoutes = void 0;
const riz_routes_1 = __importDefault(require("./routes/riz.routes"));
exports.rizRoutes = riz_routes_1.default;
const riz_service_1 = require("./services/riz.service");
Object.defineProperty(exports, "rizService", { enumerable: true, get: function () { return riz_service_1.rizService; } });
const riz_repository_1 = require("./repositories/riz.repository");
Object.defineProperty(exports, "rizRepository", { enumerable: true, get: function () { return riz_repository_1.rizRepository; } });
