export class Validator {
  static isValidEmail(email: string): boolean {
    if (!email) return false;
    const trimmed = email.trim().toLowerCase();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(trimmed);
  }

  static isValidPhone(phone: string): boolean {
    if (!phone) return false;
    const trimmed = phone.trim();
    if (/[a-zA-Z]/.test(trimmed)) return false;

    if (trimmed.startsWith('+')) {
      return /^\+[1-9]\d{6,14}$/.test(trimmed.replace(/\s+/g, ''));
    }

    const digitsOnly = trimmed.replace(/\D/g, '');
    let normalized = digitsOnly;
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      normalized = digitsOnly.slice(2);
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      normalized = digitsOnly.slice(1);
    }
    return /^[6-9][0-9]{9}$/.test(normalized);
  }
}
