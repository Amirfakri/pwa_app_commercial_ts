"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remittanceRepository = exports.remittanceService = exports.remittanceRoutes = void 0;
const remittance_routes_1 = __importDefault(require("./routes/remittance.routes"));
exports.remittanceRoutes = remittance_routes_1.default;
const remittance_service_1 = require("./services/remittance.service");
Object.defineProperty(exports, "remittanceService", { enumerable: true, get: function () { return remittance_service_1.remittanceService; } });
const remittance_repository_1 = require("./repositories/remittance.repository");
Object.defineProperty(exports, "remittanceRepository", { enumerable: true, get: function () { return remittance_repository_1.remittanceRepository; } });
