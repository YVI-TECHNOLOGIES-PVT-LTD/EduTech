import { GoogleGenAI } from '@google/genai';
import { chatbot_messages, chatbot_sender } from '@prisma/client';
import { RetrievedChunk } from '../repositories/chatbot.vector.repository';

export interface RequestedLeadFields {
  student_name?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  grade_interest?: string | null;
  preferred_board?: string | null;
}

export interface ChatbotLlmResult {
  answer: string;
  intent: string;
  confidence: number;
  leadCaptureNeeded: boolean;
  requestedLeadFields: RequestedLeadFields | null;
  escalationRequired: boolean;
  suggestedFollowUps: string[];
  modelVersion: string;
  responseTimeMs: number;
}

export interface GenerateResponseInput {
  userQuery: string;
  retrievedChunks: RetrievedChunk[];
  groundedContext: string;
  hasSufficientContext: boolean;
  conversationHistory?: chatbot_messages[];
  schoolName?: string;
}

export class ChatbotLlmService {
  private static aiClient: GoogleGenAI | null = null;
  private static readonly PRIMARY_MODEL = 'gemini-3-flash-preview';
  private static readonly FALLBACK_MODELS = [
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
  ];

  private static getAiClient(): GoogleGenAI {
    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

      if (!apiKey) {
        throw new Error('[Chatbot LLM] GEMINI_API_KEY is not defined.');
      }
      this.aiClient = new GoogleGenAI({ apiKey });
    }
    return this.aiClient;
  }

  /**
   * Helper to execute an async operation with an explicit timeout.
   */
  private static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operationName: string,
  ): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new Error(`[Chatbot LLM] Operation '${operationName}' timed out after ${timeoutMs}ms.`),
        );
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timer!);
    }
  }

  /**
   * Generates a grounded, hallucination-free response using Gemini and retrieved knowledge.
   */
  static async generateAnswer(input: GenerateResponseInput): Promise<ChatbotLlmResult> {
    const startTime = Date.now();
    const ai = this.getAiClient();
    const schoolName = input.schoolName || 'Greenwood School, Delhi';

    // Format recent chat history for context
    const formattedHistory = (input.conversationHistory || [])
      .map(
        (m) =>
          `${m.sender === chatbot_sender.user ? 'Parent/Visitor' : 'Admission Assistant'}: ${m.content}`,
      )
      .join('\n');

    const systemInstruction = `
You are the official AI Admission & Information Assistant for ${schoolName}, powered by EduTrack ERP.

CORE OBJECTIVES:
1. Provide warm, accurate, and concise answers to prospective parents and students.
2. Rely STRICTLY and EXCLUSIVELY on the retrieved knowledge base provided below.
3. NEVER invent, assume, or extrapolate dates, fee amounts, seat counts, sports, or facilities not stated in the context.
4. If the retrieved context does NOT contain sufficient details to answer the query accurately, DO NOT GUESS. State clearly that the specific information is not in the brochure/knowledge base and politely invite them to connect with the school's admissions office or leave their contact details.
5. Proactively detect prospective parent intent (e.g., asking about admissions, fee structures, curriculum, eligibility, campus tours, or scholarships) and identify if lead capture (name, phone, email, child's grade) is appropriate or present in the conversation.
6. If the user expresses extreme frustration, requests a human counsellor, or has a complex edge case, flag escalationRequired as true.

OUTPUT FORMAT:
You MUST respond with a valid, parseable JSON object matching this schema:
{
  "answer": "Clear, professional, and friendly response formatted in clean markdown (bullet points if comparing items).",
  "intent": "admission_inquiry | fee_structure | eligibility_criteria | curriculum_academics | sports_extracurricular | campus_facilities | contact_visit | lead_capture | general_faq | human_handoff | smalltalk",
  "confidence": 0.95, // float between 0.0 and 1.0 reflecting confidence based on context sufficiency
  "leadCaptureNeeded": true/false, // true if parent is asking for admission/application or if contact info should be collected
  "requestedLeadFields": {
    "student_name": "extracted or null",
    "contact_name": "extracted or null",
    "contact_phone": "extracted 10-digit phone or null",
    "contact_email": "extracted email or null",
    "grade_interest": "extracted grade e.g. Grade 11 or null",
    "preferred_board": "CBSE/ICSE/IB or null"
  },
  "escalationRequired": false, // true if human staff intervention requested
  "suggestedFollowUps": ["Question 1?", "Question 2?", "Question 3?"]
}
`;

    const userPrompt = `
=== RETRIEVED KNOWLEDGE BASE CONTEXT ===
${input.groundedContext || 'NO RELEVANT KNOWLEDGE CHUNKS RETRIEVED (Context Insufficient).'}

=== CONVERSATION HISTORY ===
${formattedHistory || 'No prior messages.'}

=== CURRENT USER QUESTION ===
${input.userQuery}
`;

    let response: any = null;
    let successfulModel = this.PRIMARY_MODEL;
    const candidateModels = [this.PRIMARY_MODEL, ...this.FALLBACK_MODELS];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const generatePromise = ai.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            temperature: 0.2, // Low temperature for high factual accuracy
          },
        });

        // Strict 10-second timeout per model invocation to guarantee responsiveness
        response = await this.withTimeout(generatePromise, 10000, `generateContent (${modelName})`);
        successfulModel = modelName;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(
          `[Chatbot LLM] Model '${modelName}' attempt failed: Status ${err.status || err.statusCode || 'N/A'}, Message: ${err.message}. Trying next candidate...`,
        );
      }
    }

    try {
      if (!response || !response.text) {
        throw new Error(
          `[Chatbot LLM] All Gemini generation candidates failed. Last error: ${lastError?.message || 'Unknown LLM failure'}`,
        );
      }

      const responseTimeMs = Date.now() - startTime;
      const rawText = response?.text || '{}';
      let parsed: any = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = {};
      }

      // Extract regex entities from user query as an additional layer of reliability
      const regexEntities = this.extractRegexEntities(input.userQuery);

      const requestedLeadFields = {
        student_name:
          parsed.requestedLeadFields?.student_name || regexEntities.student_name || null,
        contact_name:
          parsed.requestedLeadFields?.contact_name || regexEntities.contact_name || null,
        contact_phone:
          parsed.requestedLeadFields?.contact_phone || regexEntities.contact_phone || null,
        contact_email:
          parsed.requestedLeadFields?.contact_email || regexEntities.contact_email || null,
        grade_interest:
          parsed.requestedLeadFields?.grade_interest || regexEntities.grade_interest || null,
        preferred_board:
          parsed.requestedLeadFields?.preferred_board || regexEntities.preferred_board || null,
      };

      const hasAnyLeadField = Boolean(
        requestedLeadFields.contact_phone ||
        requestedLeadFields.contact_email ||
        requestedLeadFields.contact_name ||
        requestedLeadFields.student_name,
      );

      const defaultAnswer = !input.hasSufficientContext
        ? "I am sorry, but there is no mention of that in Greenwood School's current official brochure or knowledge base. Please feel free to reach out directly to our admissions office, or leave your contact details here so our team can assist you further."
        : 'Thank you for reaching out to Greenwood School. How may I assist you with admissions today?';

      return {
        answer: parsed.answer || defaultAnswer,
        intent: parsed.intent || (hasAnyLeadField ? 'lead_capture' : 'general_faq'),
        confidence:
          typeof parsed.confidence === 'number'
            ? parsed.confidence
            : input.hasSufficientContext
              ? 0.85
              : 0.2,
        leadCaptureNeeded: Boolean(parsed.leadCaptureNeeded) || hasAnyLeadField,
        requestedLeadFields: hasAnyLeadField ? requestedLeadFields : null,
        escalationRequired: Boolean(parsed.escalationRequired),
        suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps)
          ? parsed.suggestedFollowUps.slice(0, 3)
          : [],
        modelVersion: successfulModel,
        responseTimeMs,
      };
    } catch (err: any) {
      const responseTimeMs = Date.now() - startTime;
      console.error('[Chatbot LLM Error - All attempts failed]:', err?.message || err);

      const regexEntities = this.extractRegexEntities(input.userQuery);
      const hasAnyLeadField = Boolean(
        regexEntities.contact_phone || regexEntities.contact_email || regexEntities.contact_name,
      );

      const errorNotice = !input.hasSufficientContext
        ? "I could not find information regarding this in Greenwood School's knowledge base. Please connect with our admissions office or share your contact details so we can assist you."
        : 'Our admissions concierge is currently experiencing high load. Please leave your contact details or reach out directly to Greenwood School admissions.';

      return {
        answer: errorNotice,
        intent: hasAnyLeadField ? 'lead_capture' : 'general_faq',
        confidence: 0.1,
        leadCaptureNeeded: hasAnyLeadField,
        requestedLeadFields: hasAnyLeadField ? regexEntities : null,
        escalationRequired: true,
        suggestedFollowUps: [
          'What are the admission dates?',
          'What is the fee structure?',
          'How can I schedule a campus visit?',
        ],
        modelVersion: successfulModel,
        responseTimeMs,
      };
    }
  }

  /**
   * Deterministic entity regex extractor for phone, email, name, and grade.
   */
  private static extractRegexEntities(text: string): RequestedLeadFields {
    const phoneMatch = text.match(/\b([6-9]\d{9})\b/);
    const emailMatch = text.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
    const gradeMatch = text.match(/\b(?:Grade|Class)\s*(\d+|Nursery|KG|UKG|LKG)\b/i);
    const nameMatch = text.match(/(?:my name is|i am|name:?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);

    return {
      contact_phone: phoneMatch ? phoneMatch[1] : null,
      contact_email: emailMatch ? emailMatch[1] : null,
      grade_interest: gradeMatch ? gradeMatch[0] : null,
      contact_name: nameMatch ? nameMatch[1].trim() : null,
      student_name: null,
      preferred_board: null,
    };
  }
}
