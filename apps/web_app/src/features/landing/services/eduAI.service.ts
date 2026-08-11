import { IEduAIService, EduAIInput, EduAIResponse } from '../types/landing.types';

/**
 * Adapter Service Pattern for EduAI Assistant Concierge.
 * Decouples frontend chat UI from backend API contracts.
 */
class EduAIServiceAdapter implements IEduAIService {
  private mockResponses: Record<string, string> = {
    fee: 'For Academic Session 2026–27, annual fee structures vary by stage: Primary ($4,200/yr), Middle ($5,500/yr), and Senior ($6,800/yr). Flexible quarterly payment plans and merit scholarships are available.',
    eligibility:
      'Age criteria for Kindergarten: child must be 4 years old by March 31 of entry year. Grade 1: 5.5 to 6 years old. Academic transcripts from previous school are required for Grades 2–12.',
    dates:
      'Admissions for Academic Session 2026–27 opened on November 1. Seat allocations operate on a rolling basis. Early submission is recommended for Kindergarten and Grade 11.',
    apply:
      'You can apply directly online by clicking "Start Application" on the navbar, uploading birth certificate & previous report cards, and paying the $50 application fee.',
    visit:
      'We host campus tours Monday through Saturday between 9:00 AM and 2:00 PM. You can book a counselor visit via the "Book Visit" link or quick enquiry form.',
  };

  async getInitialState(): Promise<{ greeting: string; suggestedPrompts: string[] }> {
    return {
      greeting:
        '👋 Welcome to EduTrack! I am EduAI, your 24/7 Admissions Concierge. How can I assist your family today?',
      suggestedPrompts: [
        'What is the fee structure?',
        'What are the age criteria?',
        'When do admissions close?',
        'How do I apply online?',
        'Can I book a campus visit?',
      ],
    };
  }

  async sendMessage(input: EduAIInput): Promise<EduAIResponse> {
    // Simulate natural network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const text = input.message.toLowerCase();
    let reply =
      'Thank you for reaching out! Our admissions team would be delighted to assist you further. You can also submit a Quick Enquiry or schedule a campus visit anytime.';

    if (text.includes('fee') || text.includes('cost') || text.includes('tuition')) {
      reply = this.mockResponses.fee;
    } else if (text.includes('age') || text.includes('eligib') || text.includes('criteria')) {
      reply = this.mockResponses.eligibility;
    } else if (text.includes('date') || text.includes('deadline') || text.includes('close')) {
      reply = this.mockResponses.dates;
    } else if (text.includes('apply') || text.includes('process') || text.includes('form')) {
      reply = this.mockResponses.apply;
    } else if (text.includes('visit') || text.includes('tour') || text.includes('book')) {
      reply = this.mockResponses.visit;
    }

    return {
      sessionId: input.sessionId || `session-${Date.now()}`,
      reply,
      suggestedPrompts: [
        'Book a Campus Visit',
        'Talk to Admission Counselor',
        'Start Application Online',
      ],
      referenceLinks: [
        { title: 'Admission Process Guide', href: '/admission-process' },
        { title: 'Online Enquiry & Counseling', href: '/enquiry' },
      ],
    };
  }
}

export const eduAIService = new EduAIServiceAdapter();
export default eduAIService;
