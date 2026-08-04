const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function inspect() {
    console.log("--- Supabase Data Inspection ---");
    
    // Schools
    const { data: schools, error: err1 } = await supabase.from('schools').select('*');
    console.log("SCHOOLS:", err1 ? err1.message : schools);
    
    // Academic Years
    const { data: academicYears, error: err2 } = await supabase.from('academic_years').select('*');
    console.log("ACADEMIC YEARS:", err2 ? err2.message : academicYears);

    // Classes
    const { data: classes, error: err3 } = await supabase.from('classes').select('*');
    console.log("CLASSES (GRADES):", err3 ? err3.message : classes);

    // Sections
    const { data: sections, error: err4 } = await supabase.from('sections').select('*');
    console.log("SECTIONS:", err4 ? err4.message : sections);

    // Users (Counselors etc)
    const { data: users, error: err5 } = await supabase.from('users').select('id, full_name, email');
    console.log("USERS (COUNSELORS):", err5 ? err5.message : users);
}

inspect();
