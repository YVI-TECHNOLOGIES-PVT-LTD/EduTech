"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("./config/supabase");
const FeatureFlagRepository_1 = require("./modules/admission/repositories/FeatureFlagRepository");
async function run() {
    try {
        // 1. Get user details
        const { data: user, error: userError } = await supabase_1.supabase
            .from('users')
            .select('*')
            .eq('email', 'admin@edu.in')
            .single();
        if (userError) {
            throw userError;
        }
        console.log('User email:', user.email);
        console.log('User school_id:', user.school_id);
        // 2. Call findByKey directly
        const repo = new FeatureFlagRepository_1.FeatureFlagRepository();
        console.log('Calling findByKey with school_id...');
        const resultWithSchool = await repo.findByKey('student', 'student_management', 'development', user.school_id);
        console.log('findByKey result with school_id:', resultWithSchool);
        console.log('Calling findByKey with null...');
        const resultGlobal = await repo.findByKey('student', 'student_management', 'development', null);
        console.log('findByKey result global:', resultGlobal);
    }
    catch (e) {
        console.error('An error occurred during verification:', e);
    }
    process.exit(0);
}
run();
