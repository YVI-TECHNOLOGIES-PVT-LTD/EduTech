"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFolderSchema = exports.createFolderSchema = void 0;
const zod_1 = require("zod");
exports.createFolderSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Folder name is required'),
    parent_id: zod_1.z.string().uuid().optional().nullable()
});
exports.updateFolderSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Folder name is required').optional(),
    parent_id: zod_1.z.string().uuid().optional().nullable()
});
