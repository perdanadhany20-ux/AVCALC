import { describe, expect, it } from "vitest";
import { randomSlug } from "./slug";
import { safeNext } from "./safe-next";

describe("slug & redirect", () => {
  it("slug 10 karakter alfanumerik dan unik", () => {
    const set = new Set(Array.from({ length: 500 }, () => randomSlug()));
    expect(set.size).toBe(500);
    for (const s of set) expect(s).toMatch(/^[A-Za-z0-9]{10}$/);
  });
  it("safeNext hanya menerima path internal", () => {
    expect(safeNext("/projects/1")).toBe("/projects/1");
    expect(safeNext("//evil.com")).toBe("/projects");
    expect(safeNext("https://evil.com")).toBe("/projects");
    expect(safeNext(null, "/")).toBe("/");
  });
});
