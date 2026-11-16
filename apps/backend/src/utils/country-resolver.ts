import {
  parsePhoneNumberFromString,
  CountryCode,
  normalizePhoneNumber,
} from '@edutrack/validation';

export interface ResolvedCountryAndPhone {
  country_id: string;
  country_code: string;
  calling_code: string;
  phone: string;
  country: any;
}

export async function resolveCountryAndPhone(
  db: any,
  params: { phone: string; country_code?: string },
): Promise<ResolvedCountryAndPhone> {
  const rawPhone = (params.phone || '').trim();
  const rawCountryCode = params.country_code ? params.country_code.trim().toUpperCase() : undefined;

  if (!rawPhone) {
    throw new Error('Enter a valid mobile number.');
  }

  let resolvedIsoCode: string | null = null;
  let nationalNumber: string | null = null;

  // Case 1: Phone starts with '+' (E.164 string format)
  if (rawPhone.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(rawPhone);
    if (parsed && parsed.isValid()) {
      resolvedIsoCode = parsed.country || null;
      nationalNumber = parsed.nationalNumber;
    }
  }

  // Case 2: National digits with optional explicit country_code param or fallback to 'IN'
  if (!resolvedIsoCode || !nationalNumber) {
    const targetCountry: CountryCode = (rawCountryCode as CountryCode) || 'IN';
    const normalized = normalizePhoneNumber(rawPhone, targetCountry);

    if (normalized) {
      const parsed = parsePhoneNumberFromString(rawPhone, targetCountry);
      if (parsed && parsed.isValid()) {
        resolvedIsoCode = parsed.country || targetCountry;
        nationalNumber = parsed.nationalNumber;
      } else if (targetCountry === 'IN' && /^[6-9]\d{9}$/.test(normalized)) {
        resolvedIsoCode = 'IN';
        nationalNumber = normalized;
      } else {
        resolvedIsoCode = targetCountry;
        // Strip any leading country calling code if present
        nationalNumber = normalized.replace(/^\+\d+/, '');
      }
    }
  }

  // Fallback ISO code if still unresolved
  if (!resolvedIsoCode) {
    resolvedIsoCode = rawCountryCode || 'IN';
  }

  // Sanitize national number to contain ONLY digits
  if (!nationalNumber) {
    nationalNumber = rawPhone.replace(/\D/g, '');
  }
  // Strip country calling code if digits accidentally contain leading 91 for India national number
  if (resolvedIsoCode === 'IN' && nationalNumber.length === 12 && nationalNumber.startsWith('91')) {
    nationalNumber = nationalNumber.slice(2);
  }

  if (!nationalNumber) {
    throw new Error('Enter a valid mobile number.');
  }

  // Query DB countries table for active country record
  const countryRecord = await db.countries.findFirst({
    where: {
      country_code: resolvedIsoCode,
      is_active: true,
    },
  });

  if (!countryRecord) {
    throw new Error(`Unsupported or inactive phone country code (${resolvedIsoCode}).`);
  }

  return {
    country_id: countryRecord.country_id,
    country_code: countryRecord.country_code,
    calling_code: countryRecord.calling_code,
    phone: nationalNumber,
    country: countryRecord,
  };
}
