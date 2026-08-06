export class DateTransformer {
  public static transform(input: any): any {
    if (input === null || input === undefined) return input;

    if (input instanceof Date) {
      return input.toISOString();
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.transform(item));
    }

    if (typeof input === 'object') {
      const result: Record<string, any> = {};
      for (const key of Object.keys(input)) {
        result[key] = this.transform(input[key]);
      }
      return result;
    }

    return input;
  }
}

export class EnumTransformer {
  public static transform(input: any): any {
    if (typeof input === 'symbol') {
      return input.toString();
    }
    return input;
  }
}

export class NullTransformer {
  public static transform(input: any): any {
    if (input === undefined) return undefined;
    if (input === null) return null;

    if (Array.isArray(input)) {
      return input.map((item) => this.transform(item));
    }

    if (typeof input === 'object' && !(input instanceof Date)) {
      const result: Record<string, any> = {};
      for (const key of Object.keys(input)) {
        const val = this.transform(input[key]);
        if (val !== undefined) {
          result[key] = val;
        }
      }
      return result;
    }

    return input;
  }
}
