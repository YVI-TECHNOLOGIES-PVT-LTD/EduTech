import { AiCopilotValidationError } from './ai-copilot.types';

const PROMPT_INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /ignore all prior instructions/i,
  /bypass system rules/i,
  /reveal system prompt/i,
  /you are now in developer mode/i,
  /jailbreak/i,
  /override security/i,
];

const DISALLOWED_DIAGNOSES = [
  /\bADHD\b/i,
  /\bautism\b/i,
  /\bdyslexia\b/i,
  /\bdepression\b/i,
  /\banxiety disorder\b/i,
  /\bmental illness\b/i,
  /\biq\s+is\s+low\b/i,
  /\bretarded\b/i,
  /\bstupid\b/i,
  /\blazy\b/i,
];

export class AiCopilotGuardrails {
  /**
   * Sanitize teacher or student inputs before inserting into AI prompts.
   */
  static sanitizeInput(text: string, maxLength = 5000): string {
    if (!text) return '';
    let sanitized = text.trim();
    if (sanitized.length > maxLength) {
      sanitized = sanitized.slice(0, maxLength);
    }

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        throw new AiCopilotValidationError(
          'Input contains disallowed instruction override or prompt injection attempt.',
        );
      }
    }

    for (const pattern of DISALLOWED_DIAGNOSES) {
      if (pattern.test(sanitized)) {
        throw new AiCopilotValidationError(
          'Input violates educational safety guardrails (clinical/psychiatric diagnosis or medical claims are strictly prohibited).',
        );
      }
    }

    return sanitized;
  }

  /**
   * Clean raw AI text output and extract valid JSON.
   */
  static extractAndValidateJson<T = any>(rawText: string, fallbackDesc = 'AI response'): T {
    if (!rawText || rawText.trim().length === 0) {
      throw new AiCopilotValidationError(`Empty ${fallbackDesc} received from AI provider.`);
    }

    let clean = rawText.trim();
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    } else if (clean.startsWith('```')) {
      clean = clean.substring(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length - 3);
    }
    clean = clean.trim();

    try {
      const parsed = JSON.parse(clean);
      this.validateContentSafety(parsed);
      return parsed as T;
    } catch (err: any) {
      if (err instanceof AiCopilotValidationError) throw err;
      throw new AiCopilotValidationError(`Malformed JSON from AI: ${err.message}`);
    }
  }

  /**
   * Inspect generated structured content to ensure no prohibited diagnoses or derogatory language exists.
   */
  static validateContentSafety(data: any): void {
    const text = JSON.stringify(data);
    for (const pattern of DISALLOWED_DIAGNOSES) {
      if (pattern.test(text)) {
        throw new AiCopilotValidationError(
          'Generated content violated safety guardrails (unauthorized medical/psychological claim or derogatory label detected).',
        );
      }
    }
  }

  /**
   * Anonymize student names/PII before prompt assembly if needed.
   */
  static anonymizeStudentLabel(studentId: string, index: number): string {
    return `Student ${String.fromCharCode(65 + (index % 26))}-${studentId.slice(-4)}`;
  }
}
