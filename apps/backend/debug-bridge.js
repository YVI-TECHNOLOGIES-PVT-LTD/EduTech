
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testBridge() {
    console.log("1. Get Admin Context...");
    const { data: user } = await supabase.from('users').select('*').eq('email', 'admin@school.com').single();
    if (!user) { console.error("Admin not found"); return; }

    console.log(`2. Get Classes for School ${user.school_id}...`);
    const { data: classes } = await supabase.from('classes').select('*').eq('school_id', user.school_id).limit(1);
    const cls = classes[0];
    if (!cls) { console.error("No classes found"); return; }
    console.log(`- Using Class: ${cls.name} (${cls.id})`);

    console.log("3. Get Academic Year...");
    const { data: years } = await supabase.from('academic_years').select('*').eq('school_id', user.school_id).limit(1);
    const year = years[0];
    if (!year) { console.error("No academic year found"); return; }
    console.log(`- Using Year: ${year.year_label} (${year.id})`);

    console.log("4. Fetching Bridge Data...");
    // Simulate Service Logic
    const { data: sections } = await supabase.from('sections').select('id').eq('class_id', cls.id);
    if (!sections) { console.error("Could not fetch sections"); return; }

    const sectionIds = sections.map(s => s.id);
    console.log(`- Sections: ${sectionIds.length} (${sectionIds.join(', ')})`);

    if (sectionIds.length === 0) { console.log("No sections attached to this class, so no students."); return; }

    const { data: enrollments, error: enrollError } = await supabase
        .from('student_sections')
        .select(`
            student:student_id(id, full_name, student_code)
        `)
        .in('section_id', sectionIds);

    if (enrollError) {
        console.error("Enrollment error", JSON.stringify(enrollError, null, 2));
        return;
    }

    if (!enrollments) {
        console.log("Enrollments is null/undef");
        return;
    }

    const students = enrollments.map(e => e.student).filter(s => s);
    console.log(`- Found ${students.length} students via sections.`);

    if (students.length === 0) {
        // Fallback check: Are there students in the school at all?
        const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', user.school_id);
        console.log(`- Total students in school: ${count}`);
    } else {
        console.log("Data check Passed.");
    }
}

testBridge();
