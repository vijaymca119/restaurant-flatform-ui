import { describe, expect, it } from "vitest";
import {
  applicationActions,
  assignableRoles,
  can,
  canManageMember,
  canSubmitVenue,
  experienceActions,
  formatMoney,
  toMinorUnits,
} from "@/lib/lifecycle";

describe("experience lifecycle", () => {
  it("only drafts can be submitted", () => {
    expect(experienceActions("DRAFT")).toContain("submit");
    expect(experienceActions("APPROVED")).not.toContain("submit");
  });
  it("approved experiences can be published", () => {
    expect(experienceActions("APPROVED")).toContain("publish");
    expect(experienceActions("SUBMITTED")).not.toContain("publish");
  });
  it("published and paused toggle", () => {
    expect(experienceActions("PUBLISHED")).toContain("pause");
    expect(experienceActions("PAUSED")).toContain("publish");
  });
  it("archive allowed from every non-archived state", () => {
    for (const s of ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PUBLISHED", "PAUSED"] as const) {
      expect(experienceActions(s)).toContain("archive");
    }
    expect(experienceActions("ARCHIVED")).toEqual([]);
  });
});

describe("application lifecycle", () => {
  it("rejected is terminal and submitted is locked", () => {
    expect(applicationActions("REJECTED")).toEqual([]);
    expect(applicationActions("SUBMITTED")).toEqual([]);
    expect(applicationActions("DRAFT")).toContain("submit");
  });
});

describe("venue submission", () => {
  it("requires an approved, active merchant", () => {
    expect(canSubmitVenue({ status: "APPROVED", active: true })).toBe(true);
    expect(canSubmitVenue({ status: "APPROVED", active: false })).toBe(false);
    expect(canSubmitVenue({ status: "PENDING", active: true })).toBe(false);
  });
});

describe("team permissions", () => {
  it("staff cannot manage anything", () => {
    expect(can("MERCHANT_STAFF", "team:invite")).toBe(false);
    expect(assignableRoles("MERCHANT_STAFF")).toEqual([]);
  });
  it("managers can only manage staff", () => {
    expect(assignableRoles("MERCHANT_MANAGER")).toEqual(["MERCHANT_STAFF"]);
    expect(canManageMember("MERCHANT_MANAGER", "MERCHANT_OWNER")).toBe(false);
    expect(canManageMember("MERCHANT_MANAGER", "MERCHANT_STAFF")).toBe(true);
  });
  it("owners can manage everyone", () => {
    expect(canManageMember("MERCHANT_OWNER", "MERCHANT_MANAGER")).toBe(true);
  });
});

describe("money", () => {
  it("uses minor units per currency", () => {
    expect(toMinorUnits(24.5, "EUR")).toBe(2450);
    expect(toMinorUnits(300, "HUF")).toBe(30000);
    expect(formatMoney(2450, "EUR")).toBe("€24.50");
  });
});
