"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("./config/supabase");
async function run() {
    const sql = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'student_attendance_summary';
    `;
    const { data, error } = await supabase_1.supabase.rpc('exec_transaction_queries', { sql_queries: [sql] });
    if (error) {
        console.error('Error:', error);
    }
    else {
        console.log('Columns of student_attendance_summary:', data);
    }
    process.exit(0);
}
run();
