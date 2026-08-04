"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendancePercentageCalculator = void 0;
class AttendancePercentageCalculator {
    calculatePercentage(present, totalDays) {
        if (totalDays <= 0)
            return 100.00;
        return Number(((present / totalDays) * 100).toFixed(2));
    }
}
exports.AttendancePercentageCalculator = AttendancePercentageCalculator;
