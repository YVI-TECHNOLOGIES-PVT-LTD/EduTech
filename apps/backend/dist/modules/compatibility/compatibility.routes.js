"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compatibilityRouter = void 0;
const express_1 = require("express");
const admission_routes_1 = require("../admission/admission.routes");
exports.compatibilityRouter = (0, express_1.Router)();
// Mount legacy prefixes under the compatibility router
exports.compatibilityRouter.use('/admissions', admission_routes_1.admissionRouter);
