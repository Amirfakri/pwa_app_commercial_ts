"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.termsRepository = exports.termsService = exports.termsRoutes = void 0;
const terms_routes_1 = __importDefault(require("./routes/terms.routes"));
exports.termsRoutes = terms_routes_1.default;
const terms_service_1 = require("./services/terms.service");
Object.defineProperty(exports, "termsService", { enumerable: true, get: function () { return terms_service_1.termsService; } });
const terms_repository_1 = require("./repositories/terms.repository");
Object.defineProperty(exports, "termsRepository", { enumerable: true, get: function () { return terms_repository_1.termsRepository; } });
