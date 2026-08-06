import { ICacheSerializer } from '../contracts/cache.contracts';

export class JsonCacheSerializer implements ICacheSerializer {
  public serialize<T>(data: T): string {
    return JSON.stringify(data, (_key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    });
  }

  public deserialize<T>(payload: string | Buffer): T {
    const str = typeof payload === 'string' ? payload : payload.toString('utf8');
    return JSON.parse(str);
  }
}

export class CompressionCacheSerializer implements ICacheSerializer {
  private jsonSerializer = new JsonCacheSerializer();

  public serialize<T>(data: T): string {
    return this.jsonSerializer.serialize(data);
  }

  public deserialize<T>(payload: string | Buffer): T {
    return this.jsonSerializer.deserialize<T>(payload);
  }
}
