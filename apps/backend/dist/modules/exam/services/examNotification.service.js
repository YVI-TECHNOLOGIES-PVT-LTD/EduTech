"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamNotificationService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamNotificationService = {
    // 1. Exam Schedule Published
    async notifySchedulePublished(examScheduleId) {
        try {
            // Get Schedule Info
            const { data: schedule } = await supabase_1.supabase
                .from('exam_schedules')
                .select(`
                    id, exam_date, start_time, 
                    subject:subject_id(name, class:class_id(id, name)), 
                    exam:exam_id(name)
                `)
                .eq('id', examScheduleId)
                .eq('id', examScheduleId)
                .single();
            const typedSchedule = schedule;
            if (!typedSchedule || !typedSchedule.subject || !typedSchedule.subject.class)
                return;
            const className = typedSchedule.subject.class.name;
            const subjectName = typedSchedule.subject.name;
            const examName = typedSchedule.exam?.name || 'Exam';
            const date = new Date(typedSchedule.exam_date).toLocaleDateString();
            // Get students in Class -> Admission -> User
            // Path: students (status=active) -> admission (applicant_user_id) -> section -> class
            // Note: Students are linked to Section, Section linked to Class.
            // But we need user_id.
            // We use a raw query or join to get user_ids of active students in the class
            const { data: students } = await supabase_1.supabase
                .from('students')
                .select(`
                    id,
                    admission:admission_id!inner(applicant_user_id),
                    section:section_id!inner(class_id)
                `)
                .eq('section.class_id', typedSchedule.subject.class.id)
                .eq('status', 'active');
            if (!students || students.length === 0)
                return;
            const notifications = students.map((stu) => ({
                user_id: stu.admission.applicant_user_id,
                title: `New Exam Scheduled: ${subjectName}`,
                body: `Exam for ${subjectName} is scheduled on ${date}. Check your timetable.`,
                metadata: {
                    type: 'EXAM_SCHEDULE',
                    examScheduleId,
                    link: '/app/exams/timetable'
                }
            }));
            // Deduplicate by user_id just in case
            // (Not strictly needed if 1:1, but good practice)
            await supabase_1.supabase.from('notifications').insert(notifications);
        }
        catch (e) {
            console.error("Notify Schedule Error:", e);
        }
    },
    // 2. Hall Ticket Available (Triggered after Seating Generation)
    async notifyHallTicketReady(examScheduleId) {
        try {
            // Get Schedule & Exam Info
            const { data: schedule } = await supabase_1.supabase
                .from('exam_schedules')
                .select(`id, exam:exam_id(name)`)
                .eq('id', examScheduleId)
                .single();
            const typedSchedule = schedule;
            if (!typedSchedule)
                return;
            // Fetch ALlocated Students
            const { data: allocations } = await supabase_1.supabase
                .from('exam_seating_allocations')
                .select(`
                    student:student_id!inner(
                        id,
                        admission:admission_id!inner(applicant_user_id)
                    )
                `)
                .eq('exam_schedule_id', examScheduleId);
            if (!allocations || allocations.length === 0)
                return;
            const notifications = allocations.map((alloc) => ({
                user_id: alloc.student.admission.applicant_user_id,
                title: `Hall Ticket Ready: ${typedSchedule.exam?.name}`,
                body: `Your secure seat number has been generated. View your Hall Ticket now.`,
                metadata: {
                    type: 'HALL_TICKET',
                    examScheduleId,
                    link: '/app/exams/my-hall-ticket'
                }
            }));
            await supabase_1.supabase.from('notifications').insert(notifications);
        }
        catch (e) {
            console.error("Notify HallTicket Error:", e);
        }
    },
    // 3. Results Published
    async notifyResultsPublished(examId) {
        try {
            // Get Exam Name
            const { data: exam } = await supabase_1.supabase.from('exams').select('name').eq('id', examId).single();
            if (!exam)
                return;
            // Get students with published results
            const { data: summaries } = await supabase_1.supabase
                .from('student_result_summaries')
                .select(`
                    student:student_id!inner(
                        id,
                        admission:admission_id!inner(applicant_user_id)
                    )
                `)
                .eq('exam_id', examId)
                .eq('is_published', true);
            if (!summaries || summaries.length === 0)
                return;
            const notifications = summaries.map((s) => ({
                user_id: s.student.admission.applicant_user_id,
                title: `Results Published: ${exam.name}`,
                body: `The official results for ${exam.name} are now available.`,
                metadata: {
                    type: 'EXAM_RESULT',
                    examId,
                    link: '/app/exams/my-report-card'
                }
            }));
            await supabase_1.supabase.from('notifications').insert(notifications);
        }
        catch (e) {
            console.error("Notify Results Error:", e);
        }
    }
};
