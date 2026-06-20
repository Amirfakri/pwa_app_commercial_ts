"use strict";
// backend/src/modules/auth/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRepository = exports.userRepository = exports.sessionService = exports.authService = exports.requireAdmin = exports.authenticateSession = exports.authRoutes = void 0;
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
exports.authRoutes = auth_routes_1.default;
const auth_middleware_1 = require("./middlewares/auth.middleware");
Object.defineProperty(exports, "authenticateSession", { enumerable: true, get: function () { return auth_middleware_1.authenticateSession; } });
Object.defineProperty(exports, "requireAdmin", { enumerable: true, get: function () { return auth_middleware_1.requireAdmin; } });
const auth_service_1 = require("./services/auth.service");
Object.defineProperty(exports, "authService", { enumerable: true, get: function () { return auth_service_1.authService; } });
const session_service_1 = require("./services/session.service");
Object.defineProperty(exports, "sessionService", { enumerable: true, get: function () { return session_service_1.sessionService; } });
const user_repository_1 = require("./repositories/user.repository");
Object.defineProperty(exports, "userRepository", { enumerable: true, get: function () { return user_repository_1.userRepository; } });
const session_repository_1 = require("./repositories/session.repository");
Object.defineProperty(exports, "sessionRepository", { enumerable: true, get: function () { return session_repository_1.sessionRepository; } });
