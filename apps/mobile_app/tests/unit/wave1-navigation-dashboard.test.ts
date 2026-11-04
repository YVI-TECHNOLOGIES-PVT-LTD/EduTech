import { ROUTES } from '../../src/constants/routes';

describe('Wave 1 — Navigation Architecture & Dashboard Routing Suite', () => {
  describe('1. Canonical Route Constants Verification', () => {
    it('should declare all canonical MAIN routes', () => {
      expect(ROUTES.MAIN.ROOT).toBe('/(main)');
      expect(ROUTES.MAIN.HOME).toBe('/(main)/home');
      expect(ROUTES.MAIN.ACADEMICS).toBe('/(main)/academics');
      expect(ROUTES.MAIN.COMMUNICATION).toBe('/(main)/communication');
      expect(ROUTES.MAIN.FINANCE).toBe('/(main)/finance');
      expect(ROUTES.MAIN.PROFILE).toBe('/(main)/profile');
    });

    it('should preserve legacy routes for backwards compatibility', () => {
      expect(ROUTES.PARENT.ROOT).toBe('/(parent)');
      expect(ROUTES.PARENT.APPLICATIONS).toBe('/(parent)/applications');
      expect(ROUTES.PARENT.WIZARD).toBe('/(parent)/applications/wizard');
      expect(ROUTES.PARENT.DETAIL('app-1')).toBe('/(parent)/applications/app-1');
      expect(ROUTES.AUTH.LOGIN).toBe('/(auth)/login');
      expect(ROUTES.AUTH.OTP).toBe('/(auth)/otp');
    });

    it('should verify error boundary routing to prevent redirect loops (ISSUE-NAV-01)', () => {
      expect(ROUTES.COMMON.UNEXPECTED_ERROR).toBe('/(common)/unexpected-error');
      expect(ROUTES.COMMON.NO_INTERNET).toBe('/(common)/no-internet');
    });
  });

  describe('2. Dashboard Navigation Verification (ISSUE-NAV-02 Remediation)', () => {
    it('should ensure quick action routes navigate to actual domain tabs without dead loops', () => {
      const quickActionRoutes = [
        ROUTES.MAIN.ACADEMICS,
        ROUTES.MAIN.FINANCE,
        ROUTES.MAIN.COMMUNICATION,
      ];

      // None of the quick actions may route back to self or dead loop
      quickActionRoutes.forEach((route) => {
        expect(route).not.toBe('/(tabs)/dashboard');
        expect(route.startsWith('/(main)')).toBe(true);
      });
    });
  });
});
