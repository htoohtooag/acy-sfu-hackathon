export function normalizeMyanmarPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("95") ? digits.slice(2) : digits;
}

export function formatMyanmarPhoneInput(value: string): string {
  const localDigits = normalizeMyanmarPhoneInput(value);
  if (localDigits.length <= 1) return localDigits;
  return `${localDigits.slice(0, 1)} ${localDigits.slice(1, 10)}`;
}

export function toMyanmarPhonePayload(value: string): string {
  return `+95${normalizeMyanmarPhoneInput(value)}`;
}
