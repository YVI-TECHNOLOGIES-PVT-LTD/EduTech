"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("./config/supabase");
async function run() {
    const { data, error } = await supabase_1.supabase
        .from('feature_flags')
        .select('*')
        .eq('feature_key', 'student_management');
    console.log('Feature Flags for student_management:', data);
    if (error)
        console.error('Error:', error);
    process.exit(0);
}
run();
