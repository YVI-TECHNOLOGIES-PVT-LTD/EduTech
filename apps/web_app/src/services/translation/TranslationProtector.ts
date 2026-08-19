import { InterpolationParams } from './translation.types';

/**
 * TranslationProtector
 *
 * Masks and safeguards non-translatable values (Application IDs, UUIDs, emails,
 * phone numbers, URLs, technical codes, currency values, and dynamic interpolation params)
 * before sending strings to the translation engine, and restores them intact afterwards.
 */
export class TranslationProtector {
  // Common EduTrack entity and technical patterns that must NEVER be translated
  private static readonly PROTECTED_PATTERNS: RegExp[] = [
    // 1. EduTrack domain identifier prefixes (APP-XXXX, LEAD-XXXX, STU-XXXX, etc.)
    /\b(?:APP|LEAD|STU|ADM|REC|UTR|TRX|INV|REG|TKT|BATCH|SEC|CLS|ENQ)-[A-Za-z0-9-_]+\b/g,

    // 2. UUID v4 identifiers
    /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g,

    // 3. Email addresses
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,

    // 4. URLs (http/https)
    /\bhttps?:\/\/[^\s<>"'{}|\\^`]+[^\s<>"'{}|\\^`.,;:?]/g,

    // 5. Phone numbers (+91-9876543210, +1 555-0199, etc.)
    /\b(?:\+\d{1,3}[-.\s]?)?\(?\d{3,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g,

    // 6. Currency amounts (₹ 50,000, ₹10,000.00, $100, etc.)
    /[₹$€£]\s?[\d,]+(?:\.\d{1,2})?/g,

    // 7. Dynamic interpolation variables like {{name}} or {count}
    /\{\{([^{}]+)\}\}/g,
    /\{([^{}]+)\}/g,
  ];

  /**
   * Masks all protected values and parameters inside text, returning the masked string
   * and a dictionary of tokens to original values.
   */
  public static mask(
    text: string,
    params?: InterpolationParams,
  ): { maskedText: string; tokens: Map<string, string> } {
    if (!text || typeof text !== 'string') {
      return { maskedText: text || '', tokens: new Map() };
    }

    const tokens = new Map<string, string>();
    let counter = 0;
    let workingText = text;

    // First handle structured interpolation parameters if passed
    if (params && typeof params === 'object') {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        const stringVal = String(value);

        // Match {{key}} and {key}
        const paramRegexDouble = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        const paramRegexSingle = new RegExp(`\\{\\s*${key}\\s*\\}`, 'g');

        if (paramRegexDouble.test(workingText)) {
          const placeholder = `⟦P_${counter++}⟧`;
          tokens.set(placeholder, stringVal);
          workingText = workingText.replace(paramRegexDouble, placeholder);
        }

        if (paramRegexSingle.test(workingText)) {
          const placeholder = `⟦P_${counter++}⟧`;
          tokens.set(placeholder, stringVal);
          workingText = workingText.replace(paramRegexSingle, placeholder);
        }
      }
    }

    // Next mask all technical and sensitive pattern matches
    for (const pattern of this.PROTECTED_PATTERNS) {
      pattern.lastIndex = 0;
      workingText = workingText.replace(pattern, (match) => {
        // If match is already a placeholder token, leave it
        if (match.startsWith('⟦P_') && match.endsWith('⟧')) {
          return match;
        }
        const placeholder = `⟦P_${counter++}⟧`;
        tokens.set(placeholder, match);
        return placeholder;
      });
    }

    return { maskedText: workingText, tokens };
  }

  /**
   * Unmasks placeholder tokens in translated text back to their original protected values.
   */
  public static unmask(translatedText: string, tokens: Map<string, string>): string {
    if (!translatedText || tokens.size === 0) {
      return translatedText || '';
    }

    let result = translatedText;

    // Replace each token placeholder
    tokens.forEach((originalValue, token) => {
      // Direct replace
      result = result.split(token).join(originalValue);

      // Handle cases where translation engine may have stripped brackets or spaces
      const strippedToken = token.replace(/[⟦⟧]/g, '');
      if (result.includes(strippedToken)) {
        result = result.split(strippedToken).join(originalValue);
      }
    });

    return result;
  }

  /**
   * Performs client-side interpolation of {{var}} or {var} tokens directly
   * for local/English strings without translation.
   */
  public static interpolate(template: string, params?: InterpolationParams): string {
    if (!template || !params) return template || '';

    let result = template;
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      const strVal = String(value);
      result = result
        .replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), strVal)
        .replace(new RegExp(`\\{\\s*${key}\\s*\\}`, 'g'), strVal);
    }
    return result;
  }
}
