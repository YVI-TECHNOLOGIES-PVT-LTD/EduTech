"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CGPAEngine = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
class CGPAEngine extends BaseService_1.BaseService {
    calculateCgpa(gpasList) {
        if (!gpasList || gpasList.length === 0)
            return 0.00;
        const sum = gpasList.reduce((acc, curr) => acc + curr, 0);
        return sum / gpasList.length;
    }
}
exports.CGPAEngine = CGPAEngine;
exports.default = CGPAEngine;
