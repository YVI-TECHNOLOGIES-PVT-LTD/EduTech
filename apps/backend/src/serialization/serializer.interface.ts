export interface ISerializer<TInput = any, TOutput = any> {
  serialize(input: TInput): TOutput;
  deserialize(input: TOutput): TInput;
}

export class LegacyJsonSerializer implements ISerializer {
  public serialize(input: any): string {
    return JSON.stringify(input);
  }

  public deserialize(input: string): any {
    return JSON.parse(input);
  }
}

export class ResponseSerializer implements ISerializer {
  public serialize(input: any): any {
    if (!input) return input;
    const { password_hash, secret, ...safeData } = input;
    return safeData;
  }

  public deserialize(input: any): any {
    return input;
  }
}
