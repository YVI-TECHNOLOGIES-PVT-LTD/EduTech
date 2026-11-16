import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { AiCopilotProviderError, AiServiceStatusDto } from './ai-copilot.types';
import { AiCopilotGuardrails } from './ai-copilot.guardrails';

export interface AiRequestOptions {
  timeoutMs?: number;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
}

export interface AiGenerationResult<T = any> {
  rawText: string;
  data: T;
  provider: 'gemini' | 'openai' | 'mock';
  model: string;
  durationMs: number;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface IAiCopilotProvider {
  generateStructured<T = any>(
    systemPrompt: string,
    userPrompt: string,
    options?: AiRequestOptions,
  ): Promise<AiGenerationResult<T>>;
  checkStatus(): Promise<AiServiceStatusDto>;
}

export class GoogleGenAiCopilotProvider implements IAiCopilotProvider {
  private client: GoogleGenAI;
  private primaryModel: string;
  private isKeyReportedLeaked = false;

  constructor(apiKey: string, primaryModel = 'gemini-1.5-flash') {
    this.client = new GoogleGenAI({ apiKey });
    this.primaryModel = primaryModel;
  }

  async generateStructured<T = any>(
    systemPrompt: string,
    userPrompt: string,
    options: AiRequestOptions = {},
  ): Promise<AiGenerationResult<T>> {
    if (this.isKeyReportedLeaked) {
      throw new AiCopilotProviderError(
        'Gemini API key was reported as leaked/invalid by Google. Please configure a valid GEMINI_API_KEY.',
        503,
        'AI_PROVIDER_KEY_INVALID',
      );
    }

    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || 30000;
    const model = options.model || this.primaryModel;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new AiCopilotProviderError(
              `AI provider request timed out after ${timeoutMs}ms`,
              504,
              'AI_TIMEOUT',
            ),
          ),
        timeoutMs,
      );
    });

    try {
      const callPromise = (async () => {
        const fullPrompt = `${systemPrompt}\n\nIMPORTANT: Respond with pure, parseable JSON matching the requested structure ONLY.\n\n${userPrompt}`;

        const response = await this.client.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          config: {
            temperature: options.temperature ?? 0.3,
            maxOutputTokens: options.maxOutputTokens ?? 4096,
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '';
        const data = AiCopilotGuardrails.extractAndValidateJson<T>(rawText, 'AI response');
        const durationMs = Date.now() - startTime;

        return {
          rawText,
          data,
          provider: 'gemini' as const,
          model,
          durationMs,
          tokenUsage: {
            promptTokens: response.usageMetadata?.promptTokenCount,
            completionTokens: response.usageMetadata?.candidatesTokenCount,
            totalTokens: response.usageMetadata?.totalTokenCount,
          },
        };
      })();

      return await Promise.race([callPromise, timeoutPromise]);
    } catch (err: any) {
      if (err instanceof AiCopilotProviderError) throw err;
      const msg = err?.message || String(err);

      if (msg.includes('leaked') || msg.includes('API key was reported as leaked')) {
        this.isKeyReportedLeaked = true;
        throw new AiCopilotProviderError(
          'Gemini API key was reported as leaked/invalid by Google. Please configure a valid GEMINI_API_KEY in server environment.',
          503,
          'AI_PROVIDER_KEY_INVALID',
        );
      }

      if (err?.status === 429 || msg.includes('429') || msg.includes('quota')) {
        throw new AiCopilotProviderError(
          'AI provider rate limit exceeded. Please wait a moment before trying again.',
          429,
          'AI_RATE_LIMIT_EXCEEDED',
        );
      }

      throw new AiCopilotProviderError(
        `AI generation failed: ${msg}`,
        502,
        'AI_GENERATION_FAILED',
        { originalError: msg },
      );
    }
  }

  async checkStatus(): Promise<AiServiceStatusDto> {
    if (this.isKeyReportedLeaked) {
      return {
        provider: 'gemini',
        status: 'error',
        primary_model: this.primaryModel,
        capabilities: {
          lesson_planning: false,
          teaching_materials: false,
          assessments: false,
          learning_activities: false,
          performance_analysis: false,
          learning_gaps: false,
          feedback_drafting: false,
          parent_communication: false,
          student_study_assistant: false,
        },
        notice: 'Configured GEMINI_API_KEY was reported as leaked/blocked by Google API gateway.',
      };
    }

    return {
      provider: 'gemini',
      status: 'operational',
      primary_model: this.primaryModel,
      capabilities: {
        lesson_planning: true,
        teaching_materials: true,
        assessments: true,
        learning_activities: true,
        performance_analysis: true,
        learning_gaps: true,
        feedback_drafting: true,
        parent_communication: true,
        student_study_assistant: true,
      },
    };
  }
}

export class OpenAiCopilotProvider implements IAiCopilotProvider {
  private apiKey: string;
  private primaryModel: string;

  constructor(apiKey: string, primaryModel = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.primaryModel = primaryModel;
  }

  async generateStructured<T = any>(
    systemPrompt: string,
    userPrompt: string,
    options: AiRequestOptions = {},
  ): Promise<AiGenerationResult<T>> {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || 30000;
    const model = options.model || this.primaryModel;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxOutputTokens ?? 4096,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: timeoutMs,
        },
      );

      const rawText = response.data.choices[0]?.message?.content || '{}';
      const data = AiCopilotGuardrails.extractAndValidateJson<T>(rawText, 'OpenAI response');
      const durationMs = Date.now() - startTime;

      return {
        rawText,
        data,
        provider: 'openai' as const,
        model,
        durationMs,
        tokenUsage: {
          promptTokens: response.data.usage?.prompt_tokens,
          completionTokens: response.data.usage?.completion_tokens,
          totalTokens: response.data.usage?.total_tokens,
        },
      };
    } catch (err: any) {
      if (err instanceof AiCopilotProviderError) throw err;
      if (err.response?.status === 429) {
        throw new AiCopilotProviderError(
          'OpenAI rate limit exceeded. Please try again shortly.',
          429,
          'AI_RATE_LIMIT_EXCEEDED',
        );
      }
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        throw new AiCopilotProviderError(
          `AI request timed out after ${timeoutMs}ms`,
          504,
          'AI_TIMEOUT',
        );
      }
      throw new AiCopilotProviderError(
        `OpenAI request failed: ${err.response?.data?.error?.message || err.message}`,
        502,
        'AI_GENERATION_FAILED',
      );
    }
  }

  async checkStatus(): Promise<AiServiceStatusDto> {
    return {
      provider: 'openai',
      status: 'operational',
      primary_model: this.primaryModel,
      capabilities: {
        lesson_planning: true,
        teaching_materials: true,
        assessments: true,
        learning_activities: true,
        performance_analysis: true,
        learning_gaps: true,
        feedback_drafting: true,
        parent_communication: true,
        student_study_assistant: true,
      },
    };
  }
}

export class MockAiCopilotProvider implements IAiCopilotProvider {
  private mockResponses: Map<string, any> = new Map();
  private defaultResponse: any = { status: 'mock_success', message: 'Mock AI generated output' };
  private delayMs = 5;
  private shouldFailWith: Error | null = null;

  private getDefaultMockForPrompt(systemPrompt: string, userPrompt: string): any {
    const combined = `${systemPrompt} ${userPrompt}`.toLowerCase();

    if (combined.includes('lesson plan') || combined.includes('pedagogical lesson planner')) {
      return {
        title: 'Structured Lesson Plan',
        subject: 'Mathematics',
        grade_level: 'Grade 10',
        duration_minutes: 45,
        teaching_approach: 'collaborative',
        learning_objectives: ['Define fundamental concepts', 'Solve introductory problem sets'],
        prerequisite_knowledge: ['Basic arithmetic', 'Algebraic notation'],
        topic_introduction: 'Introducing the core conceptual model with real-world examples.',
        key_concepts: [{ concept: 'Core Principle', explanation: 'Foundational rule of topic' }],
        classroom_activities: [
          {
            title: 'Guided practice',
            duration_minutes: 20,
            description: 'Step by step problem solving',
          },
        ],
        teaching_resources: ['Whiteboard', 'Graph paper', 'Worksheet'],
        student_engagement_strategy: 'Pair-and-share discussion',
        differentiated_instruction: {
          support_for_struggling_learners: 'Provide scaffolded hint sheets',
          extension_for_advanced_learners: 'Offer bonus open-ended challenge questions',
        },
        assessment_checkpoints: [
          {
            checkpoint: 'Formative check',
            question: 'Solve example 1',
            expected_understanding: 'Correct factorization',
          },
        ],
        homework_recommendation: 'Complete practice problems 1 to 5',
      };
    }

    if (
      combined.includes('curriculum and instructional materials designer') ||
      combined.includes('material_type') ||
      combined.includes('worksheet')
    ) {
      return {
        title: 'Approved Practice Worksheet',
        material_type: 'worksheet',
        grade_level: 'Grade 10',
        subject: 'Mathematics',
        topic: 'Properties of Circles: Chords and Tangents',
        summary: 'Comprehensive review worksheet with definitions and practice problems.',
        key_definitions: [
          { term: 'Chord', definition: 'A line segment connecting two points on a circle.' },
        ],
        worked_examples: [
          {
            problem: 'Find chord length with radius 5 and distance 3.',
            solution: '2 * sqrt(25 - 9) = 8',
            explanation: 'Apply Pythagorean theorem on half-chord.',
          },
        ],
        discussion_prompts: ['How does distance from center affect chord length?'],
        student_worksheet: {
          instructions: 'Answer all questions showing step-by-step working.',
          practice_problems: [
            {
              question: 'Calculate chord length for radius 10 and distance 6.',
              points: 5,
              hints: 'Use right triangle',
            },
          ],
        },
        revision_checklist: ['Review chord theorem', 'Solve all 5 questions'],
      };
    }

    if (
      combined.includes('balanced assessment') ||
      combined.includes('question paper') ||
      combined.includes('assessment specialist') ||
      combined.includes('formal assessment blueprint') ||
      combined.includes('question_types') ||
      combined.includes('practice questions')
    ) {
      return {
        title: 'Midterm Assessment Blueprint',
        grade_level: 'Grade 10',
        subject: 'Mathematics',
        topic: 'Algebra and Geometry',
        duration_minutes: 60,
        total_marks: 50,
        instructions: ['Answer all questions', 'Show complete working'],
        questions: [
          {
            question_number: 1,
            question_type: 'mcq',
            question_text: 'What is the discriminant of 2x^2 + 4x + 2 = 0?',
            options: ['0', '4', '8', '16'],
            correct_answer: '0',
            explanation: 'b^2 - 4ac = 16 - 16 = 0',
            difficulty: 'easy',
            blooms_level: 'remember',
            marks: 1,
          },
          {
            question_number: 2,
            question_type: 'short_answer',
            question_text: 'State the quadratic formula.',
            correct_answer: 'x = (-b +- sqrt(b^2-4ac))/(2a)',
            explanation: 'Standard formula for finding roots',
            difficulty: 'medium',
            blooms_level: 'understand',
            marks: 2,
          },
        ],
        answer_key: [
          {
            question_number: 1,
            correct_answer: '0',
            scoring_guide: '1 mark for step, 1 for final answer',
          },
          {
            question_number: 2,
            correct_answer: 'quadratic formula',
            scoring_guide: 'Full marks for formula',
          },
        ],
      };
    }

    if (
      combined.includes('assignment designer') ||
      combined.includes('homework') ||
      combined.includes('project') ||
      combined.includes('engaging homework or project')
    ) {
      const isProject =
        userPrompt.toLowerCase().includes('activity type: project') ||
        userPrompt.toLowerCase().includes('type: project') ||
        userPrompt.toLowerCase().includes('"activity_type": "project"');
      return {
        title: 'Consolidation Assignment',
        activity_type: isProject ? 'project' : 'homework',
        target_grade: 'Grade 10',
        subject: 'Mathematics',
        overview: 'Practical task to reinforce algebraic methods.',
        detailed_instructions: 'Complete problem sets showing all intermediate steps.',
        submission_guidelines: 'Upload PDF or photo of handwritten solution.',
        deliverables: ['Step by step calculations', 'Reflection summary'],
        evaluation_rubric_summary: 'Accuracy 70%, Presentation 30%',
        recommended_duration_days: 3,
        suggested_maximum_marks: 20,
      };
    }

    if (
      combined.includes('analyze academic performance') ||
      combined.includes('educational data analyst') ||
      combined.includes('performance analysis') ||
      combined.includes('performance')
    ) {
      return {
        analysis_scope: 'Section 10-A Mathematics',
        analyzed_student_count: 28,
        data_confidence: 'high',
        data_summary:
          'Strong conceptual understanding of quadratic equations with minor calculation slips in fractional exponents.',
        overall_strengths: ['High submission rate', 'Solid grasp of core formulas'],
        areas_for_improvement: ['Sign errors in algebraic fractions', 'Word problem formulation'],
        repeated_error_patterns: ['Distributing negative signs across parentheses'],
        students_requiring_attention: [
          {
            student_label: 'Student #1',
            concern_area: 'Fraction manipulation',
            suggested_focus: 'Scaffolded practice',
          },
        ],
        suggested_remedial_topics: ['Rules of signs', 'Fractional simplification'],
      };
    }

    if (
      combined.includes('learning diagnostics specialist') ||
      combined.includes('learning gaps') ||
      combined.includes('identify learning gaps') ||
      combined.includes('learning gap')
    ) {
      return {
        topic: 'Polynomial Division',
        identified_gaps: [
          {
            concept: 'Sign distribution',
            affected_students_estimate: 6,
            severity: 'moderate',
            potential_reason_hypothesis: 'Rushing through multi-step arithmetic.',
            suggested_revision_strategy: 'Colour-coded sign brackets.',
            suggested_practice_questions: ['-(3x - 4) + 2(x - 1)'],
          },
        ],
        remedial_teaching_plan: {
          objective: 'Eliminate negative sign errors in polynomial subtraction',
          step_by_step_plan: [
            { step: 1, activity: 'Sign rule recap and visual examples', duration_minutes: 10 },
            { step: 2, activity: 'Guided practice with peer review', duration_minutes: 20 },
          ],
          follow_up_assessment_idea: '5-minute exit ticket with 3 sign problems',
        },
      };
    }

    if (combined.includes('compassionate and precise educator') || combined.includes('feedback')) {
      return {
        overall_tone: 'encouraging',
        positive_reinforcement:
          'Excellent demonstration of core algebraic concepts and structured work.',
        specific_areas_for_improvement: [
          'Double-check negative sign distribution in intermediate steps.',
        ],
        recommended_next_steps:
          'Review the sign rule summary sheet on page 42 before the next quiz.',
        draft_feedback_message:
          'Great effort on this assignment! Your layout is clear and easy to follow. Remember to pay extra attention when distributing negative signs across brackets.',
        suggested_score_range: {
          min: 18,
          max: 20,
          rationale: 'Accurate method with minor calculation oversight.',
        },
      };
    }

    if (combined.includes('school communications specialist') || combined.includes('parent')) {
      return {
        tone: 'friendly',
        subject_line: 'Academic Progress Update — Mathematics',
        greeting: 'Dear Parent / Guardian,',
        body: "I am writing to share an update on your child's recent progress in Mathematics. They have shown great consistency in class participation and scored well in recent assessments.",
        key_points: ['Consistent homework completion', 'Active participation in group tasks'],
        action_items_for_parents: ['Encourage continued daily practice for 15 minutes.'],
        closing: 'Best regards, Subject Teacher',
      };
    }

    if (
      combined.includes('study buddy') ||
      combined.includes('study coach') ||
      combined.includes('student study') ||
      combined.includes('study assistant')
    ) {
      return {
        topic: 'Pythagorean Theorem',
        conceptual_explanation:
          'The Pythagorean Theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides: a^2 + b^2 = c^2.',
        step_by_step_breakdown: [
          'Identify the two shorter legs (a and b) that meet at the 90-degree angle.',
          'Square each leg: calculate a^2 and b^2.',
          'Add them together: a^2 + b^2.',
          'Take the square root of the sum to find hypotenuse c.',
        ],
        real_world_analogy:
          'Imagine walking directly across a diagonal park instead of around two city blocks.',
        practice_questions: [
          {
            question: 'If a = 3 and b = 4, what is c?',
            hint: '3^2 + 4^2 = 9 + 16 = 25',
            answer_reveal: 'c = 5',
          },
        ],
        encouragement: 'Great question! You are building solid geometry intuition step by step.',
      };
    }

    return this.defaultResponse;
  }

  setMockResponse(key: string, data: any) {
    this.mockResponses.set(key, data);
  }

  setDefaultResponse(data: any) {
    this.defaultResponse = data;
  }

  setError(err: Error | null) {
    this.shouldFailWith = err;
  }

  setDelay(ms: number) {
    this.delayMs = ms;
  }

  async generateStructured<T = any>(
    systemPrompt: string,
    userPrompt: string,
    options: AiRequestOptions = {},
  ): Promise<AiGenerationResult<T>> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.shouldFailWith) {
      throw this.shouldFailWith;
    }

    let result = this.getDefaultMockForPrompt(systemPrompt, userPrompt);
    for (const [k, v] of this.mockResponses.entries()) {
      if (systemPrompt.includes(k) || userPrompt.includes(k)) {
        result = v;
        break;
      }
    }

    return {
      rawText: JSON.stringify(result),
      data: result as T,
      provider: 'mock',
      model: 'mock-model-v1',
      durationMs: this.delayMs,
      tokenUsage: {
        promptTokens: 120,
        completionTokens: 250,
        totalTokens: 370,
      },
    };
  }

  async checkStatus(): Promise<AiServiceStatusDto> {
    return {
      provider: 'mock',
      status: 'operational',
      primary_model: 'mock-model-v1',
      capabilities: {
        lesson_planning: true,
        teaching_materials: true,
        assessments: true,
        learning_activities: true,
        performance_analysis: true,
        learning_gaps: true,
        feedback_drafting: true,
        parent_communication: true,
        student_study_assistant: true,
      },
      notice: 'Mock AI Provider active for testing & UAT verification.',
    };
  }
}

export class AiCopilotProviderFactory {
  private static instance: IAiCopilotProvider | null = null;
  private static mockInstance: MockAiCopilotProvider | null = null;

  static setMockProvider(mock: MockAiCopilotProvider | null) {
    this.mockInstance = mock;
  }

  static getProvider(): IAiCopilotProvider {
    if (this.mockInstance) {
      return this.mockInstance;
    }

    if (this.instance) {
      return this.instance;
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey && geminiKey.trim().length > 0) {
      this.instance = new GoogleGenAiCopilotProvider(geminiKey.trim());
      return this.instance;
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && openAiKey.trim().length > 0) {
      this.instance = new OpenAiCopilotProvider(openAiKey.trim());
      return this.instance;
    }

    // Default to Mock provider if no key is supplied to prevent runtime boot crash
    return new (class UnconfiguredAiProvider implements IAiCopilotProvider {
      async generateStructured(): Promise<any> {
        throw new AiCopilotProviderError(
          'AI Provider is not configured. Please supply a valid GEMINI_API_KEY or OPENAI_API_KEY in server environment.',
          503,
          'AI_PROVIDER_NOT_CONFIGURED',
        );
      }
      async checkStatus(): Promise<AiServiceStatusDto> {
        return {
          provider: 'none',
          status: 'unconfigured',
          primary_model: 'none',
          capabilities: {
            lesson_planning: false,
            teaching_materials: false,
            assessments: false,
            learning_activities: false,
            performance_analysis: false,
            learning_gaps: false,
            feedback_drafting: false,
            parent_communication: false,
            student_study_assistant: false,
          },
          notice: 'No valid AI credentials found in environment. AI assistance is unavailable.',
        };
      }
    })();
  }

  static reset() {
    this.instance = null;
    this.mockInstance = null;
  }
}
