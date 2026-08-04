"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("./config/supabase");
async function run() {
    const { data, error } = await supabase_1.supabase
        .from('student_attendance_summary')
        .select('student_id');
    console.log('Query Result:', data);
    console.log('Error details:', error);
    process.exit(0);
}
run();
