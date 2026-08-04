"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradingService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.GradingService = {
    async calculateGrade(schoolId, percentage) {
        // 1. Fetch Grading Scales for School
        // We assume usage of a default scale if none defined, or strictly defined.
        // For efficiency, these should be cached, but we query DB for now.
        const { data: scales, error } = await supabase_1.supabase
            .from('grading_scales')
            .select('*')
            .eq('school_id', schoolId)
            .lte('min_score', percentage)
            .gte('max_score', percentage)
            .order('min_score', { ascending: false })
            .limit(1);
        if (error || !scales || scales.length === 0) {
            // Fallback generic grading if no scale found
            if (percentage >= 90)
                return { label: 'A+', point: 10 };
            if (percentage >= 80)
                return { label: 'A', point: 9 };
            if (percentage >= 70)
                return { label: 'B', point: 8 };
            if (percentage >= 60)
                return { label: 'C', point: 7 };
            if (percentage >= 50)
                return { label: 'D', point: 6 };
            if (percentage >= 35)
                return { label: 'E', point: 4 };
            return { label: 'F', point: 0 };
        }
        return { label: scales[0].grade_label, point: scales[0].grade_point };
    }
};
