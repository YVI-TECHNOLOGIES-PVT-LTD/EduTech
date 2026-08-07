import prisma from '../../../lib/prismaClient';
import {
  ApplicationTimelineDto,
  ApplicationTimelineEventDto,
} from '../dto/response/application-timeline.dto';

export class AdmissionTimelineQuery {
  static async execute(applicationId: string): Promise<ApplicationTimelineDto> {
    const app = await prisma.admissions_applications.findUnique({
      where: { application_id: applicationId },
      include: {
        leads: true,
        admission_documents: true,
        application_assessments: true,
        admission_decisions: true,
        admission_fee_payments: true,
      },
    });

    if (!app) {
      return { application_id: applicationId, timeline: [] };
    }

    const timeline: ApplicationTimelineEventDto[] = [];

    // 1. Application Creation
    if (app.created_at) {
      timeline.push({
        id: `created-${app.application_id}`,
        type: 'APPLICATION_CREATED',
        title: 'Application Created',
        description:
          `Application ${app.application_number} submitted for lead ${app.leads?.student_first_name || ''}`.trim(),
        performed_by: app.created_by || null,
        timestamp: new Date(app.created_at).toISOString(),
      });
    }

    // 2. Documents
    for (const doc of app.admission_documents || []) {
      if (doc.uploaded_at) {
        timeline.push({
          id: `doc-upload-${doc.document_id}`,
          type: 'DOCUMENT_UPLOADED',
          title: 'Document Uploaded',
          description: `Document uploaded (${doc.verify_status})`,
          performed_by: doc.created_by || null,
          timestamp: new Date(doc.uploaded_at).toISOString(),
        });
      }
      if (doc.verified_at) {
        timeline.push({
          id: `doc-verify-${doc.document_id}`,
          type: 'DOCUMENT_VERIFIED',
          title: `Document ${doc.verify_status.toUpperCase()}`,
          description:
            doc.verification_remarks || `Document status updated to ${doc.verify_status}`,
          performed_by: doc.verified_by || null,
          timestamp: new Date(doc.verified_at).toISOString(),
        });
      }
    }

    // 3. Assessment
    if (app.application_assessments) {
      const ass = app.application_assessments;
      timeline.push({
        id: `assessment-${ass.assessment_id}`,
        type: 'ASSESSMENT_RECORDED',
        title: `Assessment Recorded (${ass.result || 'PENDING'})`,
        description:
          ass.remarks ||
          `Marks obtained: ${ass.marks_obtained || 'N/A'}/${ass.maximum_marks || 'N/A'}`,
        performed_by: ass.assessed_by || ass.created_by || null,
        timestamp: new Date(ass.created_at || ass.assessment_date).toISOString(),
      });
    }

    // 4. Decision
    if (app.admission_decisions) {
      const dec = app.admission_decisions;
      timeline.push({
        id: `decision-${dec.decision_id}`,
        type: 'DECISION_RECORDED',
        title: `Decision Recorded: ${dec.decision_status.toUpperCase()}`,
        description: dec.reason || dec.remarks || `Decision status: ${dec.decision_status}`,
        performed_by: dec.decided_by || dec.created_by || null,
        timestamp: new Date(dec.decision_date || dec.created_at).toISOString(),
      });
    }

    // 5. Payment
    if (app.admission_fee_payments) {
      const pay = app.admission_fee_payments;
      timeline.push({
        id: `payment-${pay.payment_id}`,
        type: 'PAYMENT_RECORDED',
        title: `Fee Payment: ${pay.payment_status.toUpperCase()}`,
        description: `Amount: ${pay.amount} | Ref: ${pay.transaction_reference || 'N/A'}`,
        performed_by: pay.created_by || null,
        timestamp: new Date(pay.payment_date || pay.created_at).toISOString(),
      });
    }

    // Sort timeline chronologically descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      application_id: applicationId,
      timeline,
    };
  }
}
