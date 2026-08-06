import crypto from 'crypto';
import { ICryptoService, ISecretProvider } from '../contracts/security.contracts';

export class CryptoService implements ICryptoService {
  private static instance: CryptoService;
  private readonly defaultSecret = process.env.JWT_SECRET || 'edutrack-enterprise-secret-key-32chars!!';

  public static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  public encrypt(plainText: string, key = this.defaultSecret): string {
    const iv = crypto.randomBytes(16);
    const cipherKey = crypto.createHash('sha256').update(key).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', cipherKey, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  public decrypt(cipherText: string, key = this.defaultSecret): string {
    const parts = cipherText.split(':');
    if (parts.length !== 2) throw new Error('Invalid cipherText format');
    const iv = Buffer.from(parts[0], 'hex');
    const cipherKey = crypto.createHash('sha256').update(key).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', cipherKey, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  public hash(data: string, salt = ''): string {
    return crypto.createHmac('sha256', salt || this.defaultSecret).update(data).digest('hex');
  }

  public generateRandomString(length = 32): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }
}

export class EnvSecretProvider implements ISecretProvider {
  public getSecret(key: string, defaultValue = ''): string {
    return process.env[key] || defaultValue;
  }
}

export const cryptoService = CryptoService.getInstance();
