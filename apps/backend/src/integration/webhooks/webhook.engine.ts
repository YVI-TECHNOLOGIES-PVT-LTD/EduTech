import crypto from 'crypto';

export class SignatureVerifier {
  private static seenNonces = new Set<string>();

  public static sign(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  public static verify(
    payload: string,
    signature: string,
    secret: string,
    nonce?: string,
  ): boolean {
    if (nonce) {
      if (this.seenNonces.has(nonce)) return false; // Replay attack detected
      this.seenNonces.add(nonce);
      setTimeout(() => this.seenNonces.delete(nonce), 5 * 60 * 1000); // 5 min TTL
    }

    const expected = this.sign(payload, secret);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }
}

export class WebhookEngine {
  public static processInbound(
    payload: string,
    signature: string,
    secret: string,
    nonce?: string,
  ): boolean {
    return SignatureVerifier.verify(payload, signature, secret, nonce);
  }
}
