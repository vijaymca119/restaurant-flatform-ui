// UI-side mirror of backend state rules. Used only to hide invalid actions;
// the backend remains authoritative and may still reject stale/unauthorized calls.
import type {
  ApplicationStatus,
  ExperienceStatus,
  MerchantProfile,
  MerchantRole,
  Role,
} from "./api/types";

export type ExperienceAction = "edit" | "submit" | "publish" | "pause" | "archive";

export function experienceActions(status: ExperienceStatus): ExperienceAction[] {
  switch (status) {
    case "DRAFT":
      return ["edit", "submit", "archive"];
    case "SUBMITTED":
      return ["archive"];
    case "APPROVED":
      return ["publish", "archive"];
    case "PUBLISHED":
      return ["pause", "archive"];
    case "PAUSED":
      return ["publish", "archive"];
    case "REJECTED":
      return ["archive"];
    case "ARCHIVED":
      return [];
  }
}

export type ApplicationAction = "edit" | "submit";

export function applicationActions(status: ApplicationStatus): ApplicationAction[] {
  return status === "DRAFT" ? ["edit", "submit"] : [];
}

export function canSubmitVenue(merchant: Pick<MerchantProfile, "status" | "active"> | null | undefined) {
  return !!merchant && merchant.status === "APPROVED" && merchant.active;
}

export const MERCHANT_ROLES: MerchantRole[] = ["MERCHANT_OWNER", "MERCHANT_MANAGER", "MERCHANT_STAFF"];

export function merchantRoleOf(roles: Role[]): MerchantRole | null {
  return MERCHANT_ROLES.find((r) => roles.includes(r)) ?? null;
}

export function isPlatformStaff(roles: Role[]) {
  return roles.includes("PLATFORM_ADMIN") || roles.includes("PLATFORM_REVIEWER");
}

export type Permission =
  | "venues:manage"
  | "experiences:manage"
  | "team:view"
  | "team:invite"
  | "profile:edit";

const PERMISSIONS: Record<MerchantRole, Permission[]> = {
  MERCHANT_OWNER: ["venues:manage", "experiences:manage", "team:view", "team:invite", "profile:edit"],
  MERCHANT_MANAGER: ["venues:manage", "experiences:manage", "team:view", "team:invite"],
  MERCHANT_STAFF: [],
};

export function can(role: MerchantRole | null, permission: Permission) {
  return !!role && PERMISSIONS[role].includes(permission);
}

/** Roles an actor may assign when inviting or editing a member. */
export function assignableRoles(actor: MerchantRole | null): MerchantRole[] {
  if (actor === "MERCHANT_OWNER") return ["MERCHANT_OWNER", "MERCHANT_MANAGER", "MERCHANT_STAFF"];
  if (actor === "MERCHANT_MANAGER") return ["MERCHANT_STAFF"];
  return [];
}

/** Whether an actor may edit or remove a member holding `target` role. */
export function canManageMember(actor: MerchantRole | null, target: MerchantRole) {
  if (actor === "MERCHANT_OWNER") return true;
  if (actor === "MERCHANT_MANAGER") return target === "MERCHANT_STAFF";
  return false;
}

export function formatMoney(amountMinor: number, currency: string, locale = "en-GB") {
  const digits = new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions()
    .maximumFractionDigits ?? 2;
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    amountMinor / 10 ** digits,
  );
}

export function toMinorUnits(amount: number, currency: string) {
  const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
    .maximumFractionDigits ?? 2;
  return Math.round(amount * 10 ** digits);
}
