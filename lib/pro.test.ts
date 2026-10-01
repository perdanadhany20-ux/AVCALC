import { describe, expect, it } from "vitest";
import { computeProUntil } from "./pro";

const now = new Date("2026-10-02T00:00:00Z");

describe("pro:grant", () => {
  it("user free: dihitung dari sekarang", () => {
    expect(computeProUntil({ plan: "free", pro_until: null }, 3, now).toISOString()).toBe("2027-01-02T00:00:00.000Z");
  });
  it("Pro aktif: diperpanjang dari pro_until", () => {
    expect(computeProUntil({ plan: "pro", pro_until: "2026-12-01T00:00:00Z" }, 1, now).toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
  it("Pro kedaluwarsa: dihitung dari sekarang", () => {
    expect(computeProUntil({ plan: "pro", pro_until: "2026-01-01T00:00:00Z" }, 12, now).toISOString()).toBe("2027-10-02T00:00:00.000Z");
  });
  it("31 Jan + 1 bulan = 28 Feb", () => {
    expect(computeProUntil(null, 1, new Date("2027-01-31T00:00:00Z")).toISOString()).toBe("2027-02-28T00:00:00.000Z");
  });
});
