"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("./config/supabase");
async function run() {
    const { data, error } = await supabase_1.supabase
        .from('students')
        .select('*')
        .limit(1);
    if (error) {
        console.error('Error fetching student:', error);
    }
    else {
        console.log('Sample Student Row:', data?.[0] ? Object.keys(data[0]) : 'No rows found');
        console.log('Full Row Data:', data?.[0]);
    }
    process.exit(0);
}
run();
