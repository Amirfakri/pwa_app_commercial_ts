"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRepository = exports.userRepository = exports.adminService = exports.adminRoutes = void 0;
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
exports.adminRoutes = admin_routes_1.default;
const admin_service_1 = require("./services/admin.service");
Object.defineProperty(exports, "adminService", { enumerable: true, get: function () { return admin_service_1.adminService; } });
const user_repository_1 = require("./repositories/user.repository");
Object.defineProperty(exports, "userRepository", { enumerable: true, get: function () { return user_repository_1.userRepository; } });
const admin_repository_1 = require("./repositories/admin.repository");
Object.defineProperty(exports, "adminRepository", { enumerable: true, get: function () { return admin_repository_1.adminRepository; } });
