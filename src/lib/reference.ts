// Static reference lists for form inputs. The backend validates supported values.
export const COUNTRIES = [
  { code: "AT", name: "Austria", currency: "EUR", tz: "Europe/Vienna" },
  { code: "BE", name: "Belgium", currency: "EUR", tz: "Europe/Brussels" },
  { code: "CZ", name: "Czechia", currency: "CZK", tz: "Europe/Prague" },
  { code: "DK", name: "Denmark", currency: "DKK", tz: "Europe/Copenhagen" },
  { code: "FI", name: "Finland", currency: "EUR", tz: "Europe/Helsinki" },
  { code: "FR", name: "France", currency: "EUR", tz: "Europe/Paris" },
  { code: "DE", name: "Germany", currency: "EUR", tz: "Europe/Berlin" },
  { code: "GR", name: "Greece", currency: "EUR", tz: "Europe/Athens" },
  { code: "HU", name: "Hungary", currency: "HUF", tz: "Europe/Budapest" },
  { code: "IE", name: "Ireland", currency: "EUR", tz: "Europe/Dublin" },
  { code: "IT", name: "Italy", currency: "EUR", tz: "Europe/Rome" },
  { code: "NL", name: "Netherlands", currency: "EUR", tz: "Europe/Amsterdam" },
  { code: "NO", name: "Norway", currency: "NOK", tz: "Europe/Oslo" },
  { code: "PL", name: "Poland", currency: "PLN", tz: "Europe/Warsaw" },
  { code: "PT", name: "Portugal", currency: "EUR", tz: "Europe/Lisbon" },
  { code: "ES", name: "Spain", currency: "EUR", tz: "Europe/Madrid" },
  { code: "SE", name: "Sweden", currency: "SEK", tz: "Europe/Stockholm" },
  { code: "CH", name: "Switzerland", currency: "CHF", tz: "Europe/Zurich" },
  { code: "GB", name: "United Kingdom", currency: "GBP", tz: "Europe/London" },
] as const;

export const CURRENCIES = ["EUR", "GBP", "CHF", "SEK", "DKK", "NOK", "PLN", "CZK", "HUF"] as const;

export const TIME_ZONES = Array.from(new Set(COUNTRIES.map((c) => c.tz))).sort();

export const BUSINESS_TYPES = [
  { value: "SOLE_TRADER", label: "Sole trader" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "LIMITED_COMPANY", label: "Limited company" },
  { value: "RESTAURANT_GROUP", label: "Restaurant group" },
];

export const EXPERIENCE_CATEGORIES = [
  "Coffee & pastry",
  "Brunch",
  "Pizza",
  "Fixed-price dinner",
  "Tasting menu",
  "Drinks & aperitivo",
  "Other",
];

export const WEEKDAYS = [
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
  { value: "SAT", label: "Sat" },
  { value: "SUN", label: "Sun" },
] as const;

export const ROLE_LABEL: Record<string, string> = {
  MERCHANT_OWNER: "Owner",
  MERCHANT_MANAGER: "Manager",
  MERCHANT_STAFF: "Staff",
};

export const ACCEPTED_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_DOC_BYTES = 10 * 1024 * 1024;

export function countryName(code?: string) {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code ?? "—";
}
