"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamTimelineProjectionService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamTimelineProjectionService = {
    async getStudentTimeline(studentId, schoolId) {
        // 1. Get Student's Class/Section
        const { data: enrollment } = await supabase_1.supabase
            .from('student_sections')
            .select(`
                section:section_id (
                    id, name,
                    class:class_id (id, name, academic_year_id)
                )
            `)
            .eq('student_id', studentId)
            .single();
        if (!enrollment)
            return [];
        const classId = enrollment.section.class.id;
        const academicYearId = enrollment.section.class.academic_year_id;
        // 2. Get Exams for this Class
        const { data: exams } = await supabase_1.supabase
            .from('exams')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .contains('applicable_classes', [classId])
            .order('start_date', { ascending: false });
        if (!exams || exams.length === 0)
            return [];
        // For simplicity, we project the most relevant exam (latest non-completed or latest completed)
        const currentExam = exams[0];
        const timeline = [];
        // Event 1: Exam Scheduled
        const isScheduled = ['ACTIVE', 'PUBLISHED', 'COMPLETED'].includes(currentExam.status);
        timeline.push({
            id: 'exam_scheduled',
            title: 'Exam Scheduled',
            description: `Exam "${currentExam.name}" registration is active.`,
            status: isScheduled ? 'DONE' : 'READY',
            date: currentExam.created_at
        });
        // Event 2: Timetable Available
        const { data: schedules } = await supabase_1.supabase
            .from('exam_schedules')
            .select('*')
            .eq('exam_id', currentExam.id);
        const hasTimetable = schedules && schedules.length > 0;
        timeline.push({
            id: 'timetable',
            title: 'Time Table Available',
            description: hasTimetable ? 'Subjects and dates finalized.' : 'Timetable is being drafted.',
            status: hasTimetable ? 'DONE' : (isScheduled ? 'READY' : 'BLOCKED'),
            data: hasTimetable ? schedules : null
        });
        // Event 3: Eligibility Status
        const { data: eligSnapshot } = await supabase_1.supabase
            .from('exam_eligibility_snapshots')
            .select('*')
            .eq('exam_id', currentExam.id)
            .eq('student_id', studentId)
            .maybeSingle();
        timeline.push({
            id: 'eligibility',
            title: 'Eligibility Status',
            description: eligSnapshot ? (eligSnapshot.eligible ? 'You are eligible to appear.' : 'Attendance or fees pending.') : 'Eligibility check in progress.',
            status: eligSnapshot ? 'DONE' : (hasTimetable ? 'READY' : 'BLOCKED'),
            data: eligSnapshot ? {
                eligible: eligSnapshot.eligible,
                attendance: eligSnapshot.attendance_percentage,
                fees_status: eligSnapshot.fees_status,
                reasons: eligSnapshot.reasons
            } : null
        });
        // Event 4: Seating Allocation
        const isSeatingPublished = currentExam.seating_status === 'PUBLISHED';
        const { data: seating } = isSeatingPublished ? await supabase_1.supabase
            .from('exam_seating_allocations')
            .select(`
                seat_number,
                hall:hall_id (hall_name, location)
            `)
            .eq('exam_id', currentExam.id)
            .eq('student_id', studentId)
            .maybeSingle() : { data: null };
        timeline.push({
            id: 'seating',
            title: 'Seating Allocation',
            description: isSeatingPublished ? 'Hall and seat number assigned.' : 'Seating plan is being finalized.',
            status: isSeatingPublished ? 'DONE' : (eligSnapshot?.eligible ? 'READY' : 'BLOCKED'),
            data: seating
        });
        // Event 5: Hall Ticket
        const isHTPublished = currentExam.hall_ticket_status === 'PUBLISHED';
        timeline.push({
            id: 'hall_ticket',
            title: 'Hall Ticket Available',
            description: isHTPublished ? 'Download your hall ticket now.' : 'Hall tickets pending publication.',
            status: isHTPublished ? 'DONE' : (isSeatingPublished ? 'READY' : 'BLOCKED')
        });
        // Event 6: Results
        const isResultsPublished = currentExam.result_status === 'PUBLISHED';
        const { data: result } = isResultsPublished ? await supabase_1.supabase
            .from('student_result_summaries')
            .select('*')
            .eq('exam_id', currentExam.id)
            .eq('student_id', studentId)
            .maybeSingle() : { data: null };
        timeline.push({
            id: 'results',
            title: 'Results Published',
            description: isResultsPublished ? 'Your marks are available.' : 'Results are being processed.',
            status: isResultsPublished ? 'DONE' : (isHTPublished ? 'READY' : 'BLOCKED'),
            data: result
        });
        return timeline;
    },
    async getFacultyTimeline(facultyUserId, schoolId) {
        // 1. Get Faculty Sections
        const { data: assignments } = await supabase_1.supabase
            .from('faculty_sections')
            .select(`
                section:section_id (
                    id, name,
                    class:class_id (id, name, academic_year_id)
                )
            `)
            .eq('faculty_user_id', facultyUserId);
        if (!assignments || assignments.length === 0)
            return { examName: 'No Active Exams', examStatus: 'DRAFT', events: [] };
        const classIds = Array.from(new Set(assignments.map((a) => a.section.class.id)));
        const academicYearId = assignments[0].section.class.academic_year_id;
        // 2. Get active exams for these classes
        const { data: exams } = await supabase_1.supabase
            .from('exams')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .or(`applicable_classes.cs.{${classIds.join(',')}}`)
            .order('start_date', { ascending: false });
        if (!exams || exams.length === 0)
            return [];
        const currentExam = exams[0];
        // 3. Projection for Faculty
        const isSeatingPublished = currentExam.seating_status === 'PUBLISHED';
        const isPublished = currentExam.result_status === 'PUBLISHED';
        // Check locking status for subjects matching faculty's classes in this exam
        const { data: schedules } = await supabase_1.supabase
            .from('exam_schedules')
            .select('id, results_locked, subject:subject_id(name, class_id)')
            .eq('exam_id', currentExam.id);
        const relevantSchedules = schedules?.filter(s => classIds.includes(s.subject.class_id)) || [];
        const lockedCount = relevantSchedules.filter(s => s.results_locked).length;
        const totalCount = relevantSchedules.length;
        return {
            examName: currentExam.name,
            examStatus: currentExam.status,
            events: [
                {
                    id: 'marks_entry',
                    title: 'Marks Entry Status',
                    description: isPublished ? 'Entry Closed' : (isSeatingPublished ? 'Entry Open' : 'Waiting for Seating'),
                    status: isPublished ? 'DONE' : (isSeatingPublished ? 'READY' : 'PENDING'),
                    data: {
                        lockedCount,
                        totalCount,
                        progress: totalCount > 0 ? (lockedCount / totalCount) * 100 : 0
                    }
                },
                {
                    id: 'publication',
                    title: 'Publication Readiness',
                    description: isPublished ? 'Published' : (lockedCount === totalCount && totalCount > 0 ? 'Ready to Publish' : 'Awaiting Subject Locks'),
                    status: isPublished ? 'DONE' : (lockedCount === totalCount && totalCount > 0 ? 'READY' : 'PENDING')
                }
            ]
        };
    }
};
