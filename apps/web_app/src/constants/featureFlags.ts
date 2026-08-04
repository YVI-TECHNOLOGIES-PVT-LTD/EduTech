export const FEATURE_FLAGS = {
    ADMISSION: {
        LEAD_MODULE: 'admission_lead_tracking',
        EXAM_SCHEDULING: 'admission_exam_scheduling',
        EVALUATION_DESK: 'admission_evaluation_desk',
        MERIT_ENGINE: 'admission_merit_ranking',
        PAYMENT_INTEGRATION: 'admission_fee_collection',
    },
    STUDENT: {
        SIS_FOUNDATION: 'student_sis_foundation',
        ACADEMIC_HISTORY: 'student_academic_history',
        PROMOTION_TRACKER: 'student_promotion_tracker',
        IDENTITY_CARDS: 'student_identity_cards',
    },
    ATTENDANCE: {
        DAILY_MARKING: 'attendance_tracking',
        PERIOD_ATTENDANCE: 'period_attendance',
        LEAVE_BALANCES: 'leave_management',
        BIOMETRIC_DEVICE: 'biometric_sync',
        ANALYTICS: 'attendance_analytics',
    }
};
