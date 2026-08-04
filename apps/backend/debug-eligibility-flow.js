
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Mock apiClient calls using direct Supabase or Axios if hitting local server
// Since we are running on server, let's just use Supabase SDK to simulate what the endpoints do
// To be more precise, let's call the endpoints if the server is running, but let's just inspect DB directly to save time/complexity of auth.

async function debugEligibilityFlow() {
    console.log("1. Get Admin Context...");
    const { data: user } = await supabase.from('users').select('*').eq('email', 'admin@school.com').single();
    if (!user) { console.error("Admin not found"); return; }

    console.log(`2. Get Classes for School ${user.school_id}...`);
    const { data: classes } = await supabase.from('classes').select('*').eq('school_id', user.school_id).limit(1);
    const cls = classes[0];
    if (!cls) { console.error("No classes found"); return; }
    console.log(`- Using Class: ${cls.name} (${cls.id})`);

    console.log("3. Fetch Sections for Class...");
    const { data: sections } = await supabase.from('sections').select('*').eq('class_id', cls.id);
    console.log(`- Found ${sections.length} sections`);

    if (sections.length === 0) return;

    const section = sections[0];
    console.log(`- Checking Section: ${section.name} (${section.id})`);

    console.log("4. Fetch Students for Section (Simulating /students endpoint logic)...");

    // Step 4a: Get IDs from student_sections
    const { data: sectionStudents } = await supabase
        .from('student_sections')
        .select('student_id')
        .eq('section_id', section.id);

    const ids = sectionStudents.map(s => s.student_id);
    console.log(`- Found ${ids.length} student links in student_sections`);

    if (ids.length === 0) {
        console.log("No students in section.");
        return;
    }

    // Step 4b: Get Students from students table with status=active
    const { data: students, error } = await supabase
        .from('students')
        .select('id, full_name, student_code, status')
        .in('id', ids)
        .eq('school_id', user.school_id)
        .eq('status', 'active');

    if (error) console.error("Error fetching students:", error);
    else console.log(`- Found ${students.length} active students in 'students' table`);

    if (students && students.length > 0) {
        console.log("Sample Student:", students[0]);
    } else {
        // Debug why?
        console.log("Checking if students exist without status check...");
        const { data: allStudents } = await supabase.from('students').select('id, status').in('id', ids);
        console.log("Students found without status filter:", allStudents ? allStudents.length : 0);
        if (allStudents && allStudents.length > 0) {
            console.log("Sample status:", allStudents[0].status);
        }
    }
}

debugEligibilityFlow();
