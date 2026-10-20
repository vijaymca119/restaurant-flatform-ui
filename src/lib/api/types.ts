// Frontend DTOs mirroring the /api/v1 contract described in the project brief.
// Confirm field names against the backend OpenAPI spec before relying on them.

export type Role =
  | "CUSTOMER"
  | "MERCHANT_OWNER"
  | "MERCHANT_MANAGER"
  | "MERCHANT_STAFF"
  | "DISTRIBUTION_PARTNER"
  | "PLATFORM_REVIEWER"
  | "PLATFORM_ADMIN";

export type MerchantRole = "MERCHANT_OWNER" | "MERCHANT_MANAGER" | "MERCHANT_STAFF";

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Money {
  amountMinor: number;
  currency: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  displayName?: string | undefined;
  emailVerified?: boolean | undefined;
  roles: Role[];
  merchantId?: string | null | undefined;
  applicationId?: string | null | undefined;
}

export type ApplicationStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface LocationDraft {
  name: string;
  addressLine1: string;
  addressLine2?: string | undefined;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  timeZone: string;
}

export interface ExperienceDraft {
  title: string;
  description: string;
  category: string;
  price: Money;
  inclusions: string[];
  exclusions: string[];
  locationNames: string[];
  validityDays: number;
  bookingLeadHours: number;
  weekdays: Weekday[];
  blackoutDates: string[];
  redemptionInstructions: string;
}

export interface ApplicationDocument {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  documentType?: string | undefined;
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED" | undefined;
  uploadedAt: string;
}

export interface MerchantApplication {
  id: string;
  status: ApplicationStatus;
  legalName?: string | undefined;
  tradingName?: string | undefined;
  country?: string | undefined;
  registrationNumber?: string | undefined;
  taxId?: string | undefined;
  defaultCurrency?: string | undefined;
  businessType?: string | undefined;
  locations?: LocationDraft[] | undefined;
  firstExperience?: ExperienceDraft | null | undefined;
  termsAccepted?: boolean | undefined;
  documents?: ApplicationDocument[] | undefined;
  rejectionReason?: string | null | undefined;
  submittedAt?: string | null | undefined;
  reviewedAt?: string | null | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export type MerchantStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";

export interface MerchantProfile {
  id: string;
  legalName: string;
  tradingName?: string | undefined;
  country: string;
  defaultCurrency: string;
  status: MerchantStatus;
  active: boolean;
  createdAt?: string | undefined;
}

export type VenueStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "INACTIVE";

export interface Venue extends LocationDraft {
  id: string;
  status: VenueStatus;
  rejectionReason?: string | null | undefined;
  updatedAt?: string | undefined;
}

export type ExperienceStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED"
  | "PAUSED"
  | "ARCHIVED";

export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export interface Experience {
  id: string;
  title: string;
  description: string;
  category: string;
  price: Money;
  inclusions: string[];
  exclusions: string[];
  status: ExperienceStatus;
  venueIds: string[];
  availability?: { weekdays: Weekday[] | undefined; blackoutDates: string[]; bookingLeadHours: number };
  terms?: { validityDays: number | undefined; redemptionInstructions: string; version?: number | undefined };
  rejectionReason?: string | null | undefined;
  updatedAt?: string | undefined;
  merchantName?: string | undefined;
}

export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED";

export interface TeamMember {
  id: string;
  email: string;
  displayName?: string | undefined;
  role: MerchantRole;
  invitationStatus: InvitationStatus;
  venueIds?: string[] | undefined;
}

export interface AuditEvent {
  id: string;
  occurredAt: string;
  actorEmail?: string | undefined;
  action: string;
  entityType: string;
  entityId: string;
  details?: string | undefined;
}
