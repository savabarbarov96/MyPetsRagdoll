export const WAITING_NOTICE_VERSION = "2026-10-02";

export function normalizeEmail(value?: string): string | undefined {
  const email = value?.trim().toLowerCase();
  if (!email) return undefined;
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("INVALID_EMAIL");
  return email;
}

export function normalizePhone(value?: string): string | undefined {
  const original = value?.trim();
  if (!original) return undefined;
  if (original.length > 40 || !/^[+\d\s().-]+$/.test(original)) throw new Error("INVALID_PHONE");
  let phone = original.replace(/[\s().-]/g, "");
  if (phone.startsWith("00")) phone = "+" + phone.slice(2);
  if (/^0\d{9}$/.test(phone)) phone = "+359" + phone.slice(1);
  if (/^359\d{9}$/.test(phone)) phone = "+" + phone;
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("INVALID_PHONE");
  return phone;
}

export function optionalText(value: string | undefined, max: number, code: string): string | undefined {
  if (value !== undefined && value.length > max) throw new Error(code);
  return value?.trim() || undefined;
}

export function normalizeContextUrl(value: string): string {
  if (value.length > 512 || !value.startsWith("/") || value.startsWith("//") || /[\r\n\\]/.test(value)) {
    throw new Error("INVALID_CONTEXT");
  }
  return value;
}
