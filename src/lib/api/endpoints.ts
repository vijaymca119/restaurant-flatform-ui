import { queryOptions } from "@tanstack/react-query";
import { api, uploadWithProgress } from "./client";
import type {
  ApplicationDocument,
  AuditEvent,
  CurrentUser,
  Experience,
  ExperienceStatus,
  MerchantApplication,
  MerchantProfile,
  MerchantRole,
  Money,
  Page,
  TeamMember,
  Venue,
  LocationDraft,
  Weekday,
} from "./types";

// ---------- Auth (paths assumed; confirm against backend) ----------
export const auth = {
  me: () => api<CurrentUser>("/auth/me", { silent401: true }),
  login: (email: string, password: string) =>
    api<CurrentUser>("/auth/login", { method: "POST", body: { email, password }, silent401: true }),
  register: (body: { email: string; password: string; displayName: string }) =>
    api<void>("/auth/register", { method: "POST", body, silent401: true }),
  logout: () => api<void>("/auth/logout", { method: "POST", silent401: true }),
  requestPasswordReset: (email: string) =>
    api<void>("/auth/password-reset", { method: "POST", body: { email }, silent401: true }),
  resendVerification: (email: string) =>
    api<void>("/auth/verification/resend", { method: "POST", body: { email }, silent401: true }),
};

export const meQuery = () =>
  queryOptions({ queryKey: ["me"], queryFn: auth.me, retry: false, staleTime: 60_000 });

// ---------- Merchant applications ----------
export type ApplicationInput = Partial<
  Omit<MerchantApplication, "id" | "status" | "documents" | "rejectionReason">
>;

export const applications = {
  create: (body: ApplicationInput) =>
    api<MerchantApplication>("/merchant-applications", { method: "POST", body }),
  get: (id: string) => api<MerchantApplication>(`/merchant-applications/${id}`),
  update: (id: string, body: ApplicationInput) =>
    api<MerchantApplication>(`/merchant-applications/${id}`, { method: "PATCH", body }),
  uploadDocument: (id: string, file: File, documentType: string, onProgress: (p: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    form.append("documentType", documentType);
    return uploadWithProgress<ApplicationDocument>(
      `/merchant-applications/${id}/documents`,
      form,
      onProgress,
    );
  },
  submit: (id: string) =>
    api<MerchantApplication>(`/merchant-applications/${id}/submit`, { method: "POST" }),
};

export const applicationQuery = (id: string) =>
  queryOptions({ queryKey: ["application", id], queryFn: () => applications.get(id) });

// ---------- Merchant profile / venues ----------
export const merchant = {
  profile: () => api<MerchantProfile>("/merchant/profile"),
  venues: () => api<Page<Venue>>("/merchant/venues", { query: { size: 100 } }),
  createVenue: (body: LocationDraft) => api<Venue>("/merchant/venues", { method: "POST", body }),
  updateVenue: (id: string, body: Partial<LocationDraft>) =>
    api<Venue>(`/merchant/venues/${id}`, { method: "PATCH", body }),
  submitVenue: (id: string) => api<Venue>(`/merchant/venues/${id}/submit`, { method: "POST" }),
};

export const profileQuery = () =>
  queryOptions({ queryKey: ["merchant", "profile"], queryFn: merchant.profile });
export const venuesQuery = () =>
  queryOptions({ queryKey: ["merchant", "venues"], queryFn: merchant.venues });

// ---------- Experiences ----------
export interface ExperienceCore {
  title: string;
  description: string;
  category: string;
  price: Money;
  inclusions: string[];
  exclusions: string[];
}
export interface ExperienceFull extends ExperienceCore {
  venueIds: string[];
  availability: { weekdays: Weekday[]; blackoutDates: string[]; bookingLeadHours: number };
  terms: { validityDays: number; redemptionInstructions: string };
}

export const experiences = {
  list: (status?: ExperienceStatus) =>
    api<Page<Experience>>("/merchant/experiences", { query: { size: 100, status } }),
  get: (id: string) => api<Experience>(`/merchant/experiences/${id}`),
  create: (body: ExperienceCore) => api<Experience>("/merchant/experiences", { method: "POST", body }),
  update: (id: string, body: Partial<ExperienceCore>) =>
    api<Experience>(`/merchant/experiences/${id}`, { method: "PATCH", body }),
  setVenues: (id: string, venueIds: string[]) =>
    api<void>(`/merchant/experiences/${id}/venues`, { method: "PUT", body: { venueIds } }),
  setAvailability: (id: string, body: ExperienceFull["availability"]) =>
    api<void>(`/merchant/experiences/${id}/availability`, { method: "PUT", body }),
  setTerms: (id: string, body: ExperienceFull["terms"]) =>
    api<void>(`/merchant/experiences/${id}/terms`, { method: "PUT", body }),
  transition: (id: string, action: "submit" | "publish" | "pause" | "archive") =>
    api<Experience>(`/merchant/experiences/${id}/${action}`, { method: "POST" }),
  /** Create or update, then sync venues, availability and terms. */
  async save(id: string | null, data: ExperienceFull) {
    const core: ExperienceCore = {
      title: data.title,
      description: data.description,
      category: data.category,
      price: data.price,
      inclusions: data.inclusions,
      exclusions: data.exclusions,
    };
    const exp = id ? await experiences.update(id, core) : await experiences.create(core);
    await experiences.setVenues(exp.id, data.venueIds);
    await experiences.setAvailability(exp.id, data.availability);
    await experiences.setTerms(exp.id, data.terms);
    return exp;
  },
};

export const experiencesQuery = () =>
  queryOptions({ queryKey: ["merchant", "experiences"], queryFn: () => experiences.list() });
export const experienceQuery = (id: string) =>
  queryOptions({ queryKey: ["merchant", "experiences", id], queryFn: () => experiences.get(id) });

// ---------- Team ----------
export const team = {
  list: () => api<Page<TeamMember>>("/merchant/team", { query: { size: 100 } }),
  invite: (body: { email: string; role: MerchantRole }) =>
    api<TeamMember>("/merchant/team/invitations", { method: "POST", body }),
  update: (id: string, body: { role: MerchantRole }) =>
    api<TeamMember>(`/merchant/team/${id}`, { method: "PATCH", body }),
  remove: (id: string) => api<void>(`/merchant/team/${id}`, { method: "DELETE" }),
};
export const teamQuery = () => queryOptions({ queryKey: ["merchant", "team"], queryFn: team.list });

// ---------- Admin ----------
export const admin = {
  applications: (status: string | undefined, page: number) =>
    api<Page<MerchantApplication>>("/admin/merchant-applications", {
      query: { status, page, size: 20 },
    }),
  approveApplication: (id: string) =>
    api<void>(`/admin/merchant-applications/${id}/approve`, { method: "POST" }),
  rejectApplication: (id: string, reason: string) =>
    api<void>(`/admin/merchant-applications/${id}/reject`, { method: "POST", body: { reason } }),
  experiences: (status: string | undefined, page: number) =>
    api<Page<Experience>>("/admin/experiences", { query: { status, page, size: 20 } }),
  approveExperience: (id: string) => api<void>(`/admin/experiences/${id}/approve`, { method: "POST" }),
  rejectExperience: (id: string, reason: string) =>
    api<void>(`/admin/experiences/${id}/reject`, { method: "POST", body: { reason } }),
  audit: (page: number, entityId?: string) =>
    api<Page<AuditEvent>>("/admin/audit-events", { query: { page, size: 25, entityId } }),
};
