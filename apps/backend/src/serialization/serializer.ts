import { Sanitizer } from './sanitizer';
import { DateTransformer, NullTransformer } from './transformers/transformers';
import { ApiResponseBuilder } from '../common/responses/api-response.builder';

export class JsonSerializer {
  public static stringify(input: any): string {
    return JSON.stringify(input, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    });
  }

  public static parse(input: string): any {
    return JSON.parse(input);
  }
}

export class MasterSerializer {
  /**
   * 4-Stage Serialization Pipeline:
   * 1. Sanitizer: Strip SENSITIVE_FIELDS (password_hash, secret, etc.)
   * 2. Transformers: Format Dates (ISO8601), preserve nulls, remove undefined
   * 3. Formatter: Wrap in standardized ApiResponse contract
   * 4. Safe JSON Serializer: Handle BigInt & circular refs
   */
  public static process<T>(data: T, message?: string, meta?: Record<string, any>, requestId?: string): any {
    // Stage 1: Sanitize
    const sanitized = Sanitizer.sanitize(data);

    // Stage 2: Transform
    const dateTransformed = DateTransformer.transform(sanitized);
    const transformed = NullTransformer.transform(dateTransformed);

    // Stage 3: Response Format
    const formattedResponse = ApiResponseBuilder.success(transformed, message, meta, requestId);

    // Stage 4: Return formatted object (Express automatically stringifies via res.json)
    return formattedResponse;
  }
}
