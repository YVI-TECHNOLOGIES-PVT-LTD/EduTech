import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { AcademicError } from '../errors/academic.errors';

export interface AiRequestOptions {
  timeoutMs?: number;
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
  responseSchema?: any;
}

export interface AiResponse {
  rawText: string;
  parsedJson: any;
  provider: 'gemini' | 'openai' | 'mock';
  model: string;
  responseTimeMs: number;
  tokenUsage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface IAiProvider {
  generateJson(
    systemPrompt: string,
    userPrompt: string,
    options?: AiRequestOptions,
  ): Promise<AiResponse>;
}

export class GoogleGenAiProvider implements IAiProvider {
  private client: GoogleGenAI;
  private primaryModel: string;
  private fallbackModels: string[];

  constructor(apiKey: string, primaryModel = 'gemini-2.5-flash') {
    this.client = new GoogleGenAI({ apiKey });
    this.primaryModel = primaryModel;
    this.fallbackModels = ['gemini-1.5-flash', 'gemini-1.5-pro'];
  }

  async generateJson(
    systemPrompt: string,
    userPrompt: string,
    options: AiRequestOptions = {},
  ): Promise<AiResponse> {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || 25000;
    const model = options.model || this.primaryModel;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(
            new AcademicError(`AI provider timed out after ${timeoutMs}ms`, 504, 'AI_TIMEOUT'),
          ),
        timeoutMs,
      );
    });

    try {
      const callPromise = (async () => {
        const fullPrompt = `${systemPrompt}\n\nIMPORTANT: You must respond ONLY with a valid JSON object matching the requested schema. Do not include markdown code block syntax (like \`\`\`json). Just the raw JSON object.\n\n${userPrompt}`;

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
        let cleanText = rawText.trim();
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();

        let parsedJson: any;
        try {
          parsedJson = JSON.parse(cleanText);
        } catch (err: any) {
          throw new AcademicError(
            `AI returned malformed JSON: ${err.message}`,
            502,
            'AI_RESPONSE_INVALID',
            { rawText },
          );
        }

        const responseTimeMs = Date.now() - startTime;
        return {
          rawText,
          parsedJson,
          provider: 'gemini' as const,
          model,
          responseTimeMs,
          tokenUsage: {
            prompt_tokens: response.usageMetadata?.promptTokenCount,
            completion_tokens: response.usageMetadata?.candidatesTokenCount,
            total_tokens: response.usageMetadata?.totalTokenCount,
          },
        };
      })();

      return await Promise.race([callPromise, timeoutPromise]);
    } catch (error: any) {
      if (error instanceof AcademicError) throw error;
      if (
        error.status === 429 ||
        error.message?.includes('429') ||
        error.message?.includes('quota')
      ) {
        throw new AcademicError(
          'AI provider rate limit exceeded. Please try again shortly.',
          429,
          'RATE_LIMIT_EXCEEDED',
        );
      }
      throw new AcademicError(
        `AI generation failed: ${error.message}`,
        502,
        'AI_GENERATION_FAILED',
        { originalError: error.message },
      );
    }
  }
}

export class OpenAiProvider implements IAiProvider {
  private apiKey: string;
  private primaryModel: string;

  constructor(apiKey: string, primaryModel = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.primaryModel = primaryModel;
  }

  async generateJson(
    systemPrompt: string,
    userPrompt: string,
    options: AiRequestOptions = {},
  ): Promise<AiResponse> {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || 25000;
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
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(rawText);
      } catch (err: any) {
        throw new AcademicError(
          `AI returned malformed JSON: ${err.message}`,
          502,
          'AI_RESPONSE_INVALID',
          { rawText },
        );
      }

      const responseTimeMs = Date.now() - startTime;
      return {
        rawText,
        parsedJson,
        provider: 'openai' as const,
        model,
        responseTimeMs,
        tokenUsage: {
          prompt_tokens: response.data.usage?.prompt_tokens,
          completion_tokens: response.data.usage?.completion_tokens,
          total_tokens: response.data.usage?.total_tokens,
        },
      };
    } catch (error: any) {
      if (error instanceof AcademicError) throw error;
      if (error.response?.status === 429) {
        throw new AcademicError(
          'OpenAI rate limit exceeded. Please try again shortly.',
          429,
          'RATE_LIMIT_EXCEEDED',
        );
      }
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new AcademicError(`AI provider timed out after ${timeoutMs}ms`, 504, 'AI_TIMEOUT');
      }
      throw new AcademicError(
        `AI generation failed: ${error.response?.data?.error?.message || error.message}`,
        502,
        'AI_GENERATION_FAILED',
      );
    }
  }
}

export class MockAiProvider implements IAiProvider {
  private mockResult: any;
  private shouldFailWith: AcademicError | null = null;
  private delayMs = 10;

  constructor(mockResult?: any) {
    this.mockResult = mockResult;
  }

  setMockResult(result: any) {
    this.mockResult = result;
    this.shouldFailWith = null;
  }

  setError(error: AcademicError) {
    this.shouldFailWith = error;
  }

  setDelay(ms: number) {
    this.delayMs = ms;
  }

  async generateJson(
    systemPrompt: string,
    userPrompt: string,
    options: AiRequestOptions = {},
  ): Promise<AiResponse> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }

    if (this.shouldFailWith) {
      throw this.shouldFailWith;
    }

    if (!this.mockResult) {
      throw new AcademicError(
        'Mock AI Provider has no configured result',
        502,
        'AI_GENERATION_FAILED',
      );
    }

    return {
      rawText: JSON.stringify(this.mockResult),
      parsedJson: this.mockResult,
      provider: 'mock',
      model: 'mock-model-v1',
      responseTimeMs: this.delayMs,
      tokenUsage: {
        prompt_tokens: 150,
        completion_tokens: 350,
        total_tokens: 500,
      },
    };
  }
}

export class AiProviderFactory {
  private static instance: IAiProvider | null = null;
  private static mockInstance: MockAiProvider | null = null;

  static setMockProvider(mock: MockAiProvider | null) {
    this.mockInstance = mock;
  }

  static getProvider(): IAiProvider {
    if (this.mockInstance) {
      return this.mockInstance;
    }

    if (this.instance) {
      return this.instance;
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (geminiKey && geminiKey.trim().length > 0) {
      this.instance = new GoogleGenAiProvider(geminiKey.trim());
      return this.instance;
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && openAiKey.trim().length > 0) {
      this.instance = new OpenAiProvider(openAiKey.trim());
      return this.instance;
    }

    throw new AcademicError(
      'AI Provider is not configured. GEMINI_API_KEY or OPENAI_API_KEY must be provided in server environment.',
      503,
      'AI_PROVIDER_NOT_CONFIGURED',
    );
  }

  static reset() {
    this.instance = null;
    this.mockInstance = null;
  }
}
