"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamHallTicketService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamHallTicketService = {
    /**
     * Generate Hall Tickets for all seated students of an exam (Atomic RPC)
     */
    async generateHallTickets(examId, userId, schoolId) {
        // Validation and insertion moved to Database RPC for Atomicity
        const { error } = await supabase_1.supabase.rpc('fn_generate_hall_tickets', {
            p_exam_id: examId,
            p_school_id: schoolId,
            p_user_id: userId
        });
        if (error) {
            console.error("Hall Ticket Generation Failed:", error);
            if (error.message?.includes('SEATING_NOT_PUBLISHED'))
                throw new Error("SEATING_NOT_PUBLISHED: Please publish seating allocation first.");
            if (error.message?.includes('HALL_TICKETS_LOCKED'))
                throw new Error("HALL_TICKETS_LOCKED: Cannot regenerate after publication.");
            if (error.message?.includes('NO_SEATING_FOUND'))
                throw new Error("NO_SEATING_FOUND: No students found in seating allocation.");
            throw error;
        }
        return { success: true };
    },
    /**
     * Publish Hall Tickets (Phase-3 Lifecycle)
     */
    async publishHallTickets(examId, userId) {
        const { error } = await supabase_1.supabase.rpc('fn_publish_hall_tickets', {
            p_exam_id: examId,
            p_user_id: userId
        });
        if (error) {
            console.error("Hall Ticket Publish Failed:", error);
            if (error.message?.includes('TICKETS_NOT_READY'))
                throw new Error("TICKETS_NOT_READY: Generate hall tickets before publishing.");
            throw error;
        }
        return { success: true };
    },
    /**
     * Get Hall Tickets for display
     */
    async getHallTickets(examId) {
        const { data, error } = await supabase_1.supabase
            .from('exam_hall_tickets')
            .select(`
                *,
                student:student_id(full_name, student_code)
            `)
            .eq('exam_id', examId)
            .order('generated_at', { ascending: false });
        if (error)
            throw error;
        return data;
    },
    /**
     * Get a specific Hall Ticket (Student view)
     */
    async getStudentHallTicket(studentId, examId) {
        const { data, error } = await supabase_1.supabase
            .from('exam_hall_tickets')
            .select(`
                *,
                exam:exam_id(name, start_date, end_date),
                student:student_id(full_name, student_code)
            `)
            .eq('student_id', studentId)
            .eq('exam_id', examId)
            .single();
        if (error)
            return null;
        return data;
    },
    /**
     * PHASE-14/15: HARDENED PDF GENERATION
     */
    async generateHallTicketPDF(examId, studentId, schoolId) {
        const puppeteer = require('puppeteer');
        const fs = require('fs');
        const path = require('path');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        try {
            // 1. Data Aggregation
            const { data: exam, error: examError } = await supabase_1.supabase
                .from('exams')
                .select('*, school:school_id(*)')
                .eq('id', examId)
                .single();
            if (examError || !exam)
                throw new Error("EXAM_NOT_FOUND");
            if (exam.seating_status !== 'PUBLISHED')
                throw new Error("SEATING_NOT_PUBLISHED");
            if (exam.hall_ticket_status !== 'PUBLISHED')
                throw new Error("HALL_TICKET_NOT_PUBLISHED");
            const { data: student, error: studentError } = await supabase_1.supabase
                .from('students')
                .select(`
                    *,
                    admission:admission_id(father_name),
                    sections:student_sections(section:section_id(name, class:class_id(name)))
                `)
                .eq('id', studentId)
                .single();
            if (studentError || !student)
                throw new Error("STUDENT_NOT_FOUND");
            const { data: seating, error: seatError } = await supabase_1.supabase
                .from('exam_seating_allocations')
                .select('*, hall:hall_id(*)')
                .eq('exam_id', examId)
                .eq('student_id', studentId)
                .single();
            if (seatError || !seating)
                throw new Error("SEATING_NOT_FOUND");
            const { data: schedules, error: schError } = await supabase_1.supabase
                .from('exam_schedules')
                .select(`
                    *,
                    subject:subject_id(name, code)
                `)
                .eq('exam_id', examId)
                .order('exam_date', { ascending: true });
            if (schError)
                throw schError;
            // 2. Render HTML Template
            const templatePath = path.join(__dirname, '../templates/hall-ticket.template.html');
            let htmlContent = '';
            try {
                htmlContent = fs.readFileSync(templatePath, 'utf8');
            }
            catch (e) {
                htmlContent = `<html><body><h1>Hall Ticket - {{studentName}}</h1></body></html>`;
            }
            // Simple string replacement for template
            const replacements = {
                '{{schoolName}}': exam.school.name,
                '{{schoolAddress}}': exam.school.address || '',
                '{{schoolContact}}': exam.school.contact || '',
                '{{logoUrl}}': exam.school.logo_url || '',
                '{{examName}}': exam.name,
                '{{studentName}}': student.full_name,
                '{{studentCode}}': student.student_code,
                '{{admissionNo}}': student.student_code,
                '{{fatherName}}': student.admission?.father_name || '',
                '{{className}}': student.sections?.[0]?.section?.class?.name || '',
                '{{sectionName}}': student.sections?.[0]?.section?.name || '',
                '{{hallName}}': seating.hall.hall_name,
                '{{building}}': seating.hall.building || '',
                '{{floor}}': seating.hall.floor || '',
                '{{seatNumber}}': seating.seat_number,
                '{{dob}}': student.dob || ''
            };
            Object.keys(replacements).forEach(key => {
                htmlContent = htmlContent.split(key).join(replacements[key] || '');
            });
            // Subject Table
            let scheduleRows = '';
            schedules.forEach((s) => {
                scheduleRows += `
                    <tr>
                        <td>${s.subject.name} (${s.subject.code || '-'})</td>
                        <td>${s.exam_date}</td>
                        <td>${s.start_time} - ${s.end_time}</td>
                    </tr>
                `;
            });
            htmlContent = htmlContent.replace('{{scheduleRows}}', scheduleRows);
            // 3. Optimized Puppeteer Rendering
            await page.emulateMediaType('screen');
            await page.setViewport({ width: 1240, height: 1754 });
            await page.setContent(htmlContent, {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });
            const result = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true
            });
            const pdfBuffer = Buffer.from(result);
            // 4. Audit Log (Fire and forget, but safe)
            (async () => {
                try {
                    await supabase_1.supabase.from('academic_automation_logs').insert({
                        school_id: schoolId,
                        action: 'HALL_TICKET_PDF_GEN',
                        details: { examId, studentId, timestamp: new Date().toISOString() },
                        performed_by: schoolId
                    });
                }
                catch (e) {
                    console.error("Audit log failed", e);
                }
            })();
            if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
                throw new Error("GENERATION_FAILED: Invalid PDF buffer produced");
            }
            return pdfBuffer;
        }
        finally {
            await page.close();
            await browser.close();
        }
    },
    async generateBulkHallTicketsZip(examId, schoolId) {
        const archiver = require('archiver');
        const puppeteer = require('puppeteer');
        const fs = require('fs');
        const path = require('path');
        // 1. Get all eligible students (seated)
        const { data: tickets, error: ticketError } = await supabase_1.supabase
            .from('exam_hall_tickets')
            .select('student_id, student:student_id(student_code, full_name)')
            .eq('exam_id', examId);
        if (ticketError || !tickets || tickets.length === 0)
            throw new Error("NO_TICKETS_FOUND");
        // 2. Data Aggregation for Template (Shared across all tickets for efficiency)
        const { data: exam } = await supabase_1.supabase.from('exams').select('*, school:school_id(*)').eq('id', examId).single();
        const { data: schedules } = await supabase_1.supabase.from('exam_schedules').select('*, subject:subject_id(name, code)').eq('exam_id', examId).order('exam_date', { ascending: true });
        const templatePath = path.join(__dirname, '../templates/hall-ticket.template.html');
        const masterTemplate = fs.existsSync(templatePath) ? fs.readFileSync(templatePath, 'utf8') : '';
        // 3. Setup Browser Once
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const archive = archiver('zip', { zlib: { level: 9 } });
        return new Promise(async (resolve, reject) => {
            const bufferChunks = [];
            archive.on('data', (chunk) => bufferChunks.push(chunk));
            archive.on('end', () => resolve(Buffer.concat(bufferChunks)));
            archive.on('error', (err) => reject(err));
            try {
                // 4. Sequential Processing
                for (const t of tickets) {
                    const page = await browser.newPage();
                    try {
                        const studentId = t.student_id;
                        const studentCode = t.student.student_code;
                        // Fetch specific seating for this student
                        const { data: seating } = await supabase_1.supabase.from('exam_seating_allocations').select('*, hall:hall_id(*)').eq('exam_id', examId).eq('student_id', studentId).single();
                        const { data: studentDetails } = await supabase_1.supabase.from('students').select('*, admission:admission_id(father_name), sections:student_sections(section:section_id(name, class:class_id(name)))').eq('id', studentId).single();
                        if (!seating || !studentDetails)
                            continue;
                        let html = masterTemplate;
                        const replacements = {
                            '{{schoolName}}': exam.school.name,
                            '{{schoolAddress}}': exam.school.address || '',
                            '{{schoolContact}}': exam.school.contact || '',
                            '{{logoUrl}}': exam.school.logo_url || '',
                            '{{examName}}': exam.name,
                            '{{studentName}}': studentDetails.full_name,
                            '{{studentCode}}': studentDetails.student_code,
                            '{{admissionNo}}': studentDetails.student_code,
                            '{{fatherName}}': studentDetails.admission?.father_name || '',
                            '{{className}}': studentDetails.sections?.[0]?.section?.class?.name || '',
                            '{{sectionName}}': studentDetails.sections?.[0]?.section?.name || '',
                            '{{hallName}}': seating.hall.hall_name,
                            '{{building}}': seating.hall.building || '',
                            '{{floor}}': seating.hall.floor || '',
                            '{{seatNumber}}': seating.seat_number,
                            '{{dob}}': studentDetails.dob || ''
                        };
                        Object.keys(replacements).forEach(key => { html = html.split(key).join(replacements[key] || ''); });
                        let rows = '';
                        schedules?.forEach((s) => { rows += `<tr><td>${s.subject.name}</td><td>${s.exam_date}</td><td>${s.start_time}</td></tr>`; });
                        html = html.replace('{{scheduleRows}}', rows);
                        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
                        const result = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
                        const pdf = Buffer.from(result);
                        if (pdf && pdf.length > 0) {
                            archive.append(pdf, { name: `HallTicket_${studentCode}.pdf` });
                        }
                        else {
                            console.error(`Skipping invalid PDF for ${studentCode}`);
                        }
                    }
                    catch (err) {
                        console.error(`Bulk failure for student ${t.student_id}:`, err);
                    }
                    finally {
                        await page.close();
                    }
                }
                // Audit Log Bulk
                (async () => {
                    try {
                        await supabase_1.supabase.from('academic_automation_logs').insert({
                            school_id: schoolId,
                            action: 'HALL_TICKET_BULK_REISSUE',
                            details: { examId, count: tickets.length },
                            performed_by: schoolId
                        });
                    }
                    catch (e) {
                        console.error("Bulk audit failed", e);
                    }
                })();
            }
            finally {
                await browser.close();
                archive.finalize();
            }
        });
    }
};
