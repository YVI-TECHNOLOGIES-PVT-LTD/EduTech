"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academicRecordsRouter = void 0;
const express_1 = require("express");
const AcademicRecordsController_1 = require("./controllers/AcademicRecordsController");
const GraduationController_1 = require("./controllers/GraduationController");
const TranscriptRequestController_1 = require("./controllers/TranscriptRequestController");
const rbac_middleware_1 = require("../../../rbac/rbac.middleware");
exports.academicRecordsRouter = (0, express_1.Router)();
// ==========================================
// STUDENT PROFILE ACADEMIC HISTORIES
// ==========================================
exports.academicRecordsRouter.post('/records', (0, rbac_middleware_1.checkPermission)('academic.records.manage'), AcademicRecordsController_1.AcademicRecordsController.saveRecord);
// ==========================================
// GRADUATION COMPLIANCE WORKFLOWS
// ==========================================
exports.academicRecordsRouter.post('/graduation/candidate', (0, rbac_middleware_1.checkPermission)('academic.records.manage'), GraduationController_1.GraduationController.transitionGraduation);
exports.academicRecordsRouter.post('/graduation/clearance', (0, rbac_middleware_1.checkPermission)('academic.records.manage'), GraduationController_1.GraduationController.approveClearance);
// ==========================================
// TRANSCRIPT GENERATION
// ==========================================
exports.academicRecordsRouter.post('/transcripts/request', (0, rbac_middleware_1.checkPermission)('academic.records.manage'), TranscriptRequestController_1.TranscriptRequestController.createRequest);
exports.academicRecordsRouter.post('/transcripts/generate', (0, rbac_middleware_1.checkPermission)('academic.records.manage'), TranscriptRequestController_1.TranscriptRequestController.generateTranscript);
exports.default = exports.academicRecordsRouter;
