
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    console.log("Checking Students Data...");

    const { data: schools } = await supabase.from('schools').select('id, name');
    console.log("Schools:", schools);

    const { data: students, count } = await supabase.from('students').select('id, school_id, status', { count: 'exact' });
    console.log(`Total students: ${count}`);

    if (students) {
        const stats = students.reduce((acc, s) => {
            const key = `${s.school_id} | ${s.status}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        console.log("Stats (School ID | Status):", stats);
    }

    // Check a section from Class 1
    const { data: classes } = await supabase.from('classes').select('id, name, school_id').eq('name', 'Class 1').limit(1);
    const cls = classes[0];
    if (cls) {
        console.log(`Class 1 (School: ${cls.school_id}) info:`, cls);
        const { data: sections } = await supabase.from('sections').select('id, name').eq('class_id', cls.id);
        console.log("Sections:", sections);

        if (sections.length > 0) {
            const secId = sections[0].id;
            const { data: enrolls } = await supabase.from('student_sections').select('student_id').eq('section_id', secId);
            console.log(`Section ${sections[0].name} has ${enrolls.length} enrollments`);

            if (enrolls.length > 0) {
                const stuId = enrolls[0].student_id;
                const { data: stu } = await supabase.from('students').select('*').eq('id', stuId).single();
                console.log("Sample Student in Section:", {
                    id: stu.id,
                    name: stu.full_name,
                    school_id: stu.school_id,
                    status: stu.status
                });
            }
        }
    }
}

checkData();
