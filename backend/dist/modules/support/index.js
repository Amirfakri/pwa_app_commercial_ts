"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.descriptionRepository = exports.termsRepository = exports.descriptionService = exports.termsService = exports.descriptionRoutes = exports.termsRoutes = void 0;
// backend/src/modules/support/index.ts
const terms_routes_1 = __importDefault(require("./routes/terms.routes"));
exports.termsRoutes = terms_routes_1.default;
const description_routes_1 = __importDefault(require("./routes/description.routes"));
exports.descriptionRoutes = description_routes_1.default;
const terms_service_1 = require("./services/terms.service");
Object.defineProperty(exports, "termsService", { enumerable: true, get: function () { return terms_service_1.termsService; } });
const description_service_1 = require("./services/description.service");
Object.defineProperty(exports, "descriptionService", { enumerable: true, get: function () { return description_service_1.descriptionService; } });
const terms_repository_1 = require("./repositories/terms.repository");
Object.defineProperty(exports, "termsRepository", { enumerable: true, get: function () { return terms_repository_1.termsRepository; } });
const description_repository_1 = require("./repositories/description.repository");
Object.defineProperty(exports, "descriptionRepository", { enumerable: true, get: function () { return description_repository_1.descriptionRepository; } });
