"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFeatureFlagSchema = void 0;
const zod_1 = require("zod");
exports.updateFeatureFlagSchema = zod_1.z.object({
    enabled: zod_1.z.boolean({
        required_error: 'Enabled flag is required'
    })
});
