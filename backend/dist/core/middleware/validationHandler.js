"use strict";
// backend/src/core/middleware/validationHandler.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const AppError_1 = require("../exceptions/AppError");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        throw new AppError_1.ValidationError(errorMessages.join(', '), errors.array());
    }
    next();
};
exports.validateRequest = validateRequest;
