import {
  validateProductionApiUrl,
  validateProductionWsUrl,
  normalizeApiUrl,
  enforceProductionGuard,
  VERIFIED_PRODUCTION_HOST,
  VERIFIED_PRODUCTION_API_URL,
  VERIFIED_PRODUCTION_WS_URL,
} from '../../src/config/production-guard';

describe('Strict Production Build Guard Validation', () => {
  describe('validateProductionApiUrl', () => {
    it('approves the verified Render production URL', () => {
      const res = validateProductionApiUrl(VERIFIED_PRODUCTION_API_URL);
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('rejects empty or missing URL', () => {
      expect(validateProductionApiUrl('').isValid).toBe(false);
      expect(validateProductionApiUrl(null as any).isValid).toBe(false);
      expect(validateProductionApiUrl(undefined as any).isValid).toBe(false);
    });

    it('rejects cleartext HTTP', () => {
      const res = validateProductionApiUrl(`http://${VERIFIED_PRODUCTION_HOST}/api`);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('must use HTTPS');
    });

    it('rejects localhost and loopback endpoints', () => {
      expect(validateProductionApiUrl('https://localhost:3000/api').isValid).toBe(false);
      expect(validateProductionApiUrl('https://127.0.0.1:3000/api').isValid).toBe(false);
      expect(validateProductionApiUrl('http://10.0.2.2:3000/api').isValid).toBe(false);
    });

    it('rejects private LAN IP addresses', () => {
      expect(validateProductionApiUrl('https://192.168.1.50:3000/api').isValid).toBe(false);
      expect(validateProductionApiUrl('https://10.0.0.5:3000/api').isValid).toBe(false);
      expect(validateProductionApiUrl('https://172.16.0.1:3000/api').isValid).toBe(false);
    });

    it('rejects placeholder domain api.edutrack.com', () => {
      const res = validateProductionApiUrl('https://api.edutrack.com/api');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('placeholder domain');
    });

    it('rejects development and staging subdomains', () => {
      expect(validateProductionApiUrl('https://staging-api.edutrack.com/api').isValid).toBe(false);
      expect(validateProductionApiUrl('https://dev-backend.onrender.com/api').isValid).toBe(false);
    });

    it('rejects unknown Render services or arbitrary domains', () => {
      const res = validateProductionApiUrl('https://random-service.onrender.com/api');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('does not match the verified Render production backend');
    });

    it('rejects incorrect API prefix paths', () => {
      const res = validateProductionApiUrl(`https://${VERIFIED_PRODUCTION_HOST}/v2`);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('pathname must be "/api"');
    });
  });

  describe('normalizeApiUrl', () => {
    it('strips trailing slashes and ensures /api is present', () => {
      expect(normalizeApiUrl(`https://${VERIFIED_PRODUCTION_HOST}`)).toBe(
        `https://${VERIFIED_PRODUCTION_HOST}/api`,
      );
      expect(normalizeApiUrl(`https://${VERIFIED_PRODUCTION_HOST}/`)).toBe(
        `https://${VERIFIED_PRODUCTION_HOST}/api`,
      );
      expect(normalizeApiUrl(`https://${VERIFIED_PRODUCTION_HOST}/api`)).toBe(
        `https://${VERIFIED_PRODUCTION_HOST}/api`,
      );
      expect(normalizeApiUrl(`https://${VERIFIED_PRODUCTION_HOST}/api/`)).toBe(
        `https://${VERIFIED_PRODUCTION_HOST}/api`,
      );
    });
  });

  describe('validateProductionWsUrl', () => {
    it('approves the verified Render production WebSocket URL', () => {
      const res = validateProductionWsUrl(VERIFIED_PRODUCTION_WS_URL);
      expect(res.isValid).toBe(true);
    });

    it('rejects unencrypted WS protocol in production', () => {
      const res = validateProductionWsUrl(`ws://${VERIFIED_PRODUCTION_HOST}/ws/notifications`);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('must use WSS protocol');
    });

    it('rejects localhost and emulator WebSocket endpoints', () => {
      expect(validateProductionWsUrl('ws://localhost:3000/ws/notifications').isValid).toBe(false);
      expect(validateProductionWsUrl('ws://10.0.2.2:3000/ws/notifications').isValid).toBe(false);
    });
  });

  describe('enforceProductionGuard', () => {
    it('does not throw on valid verified Render URLs', () => {
      expect(() =>
        enforceProductionGuard(VERIFIED_PRODUCTION_API_URL, VERIFIED_PRODUCTION_WS_URL),
      ).not.toThrow();
    });

    it('throws error on forbidden localhost URL', () => {
      expect(() => enforceProductionGuard('http://localhost:3000/api')).toThrow(
        'CRITICAL PRODUCTION BUILD GUARD FAILURE',
      );
    });
  });
});
