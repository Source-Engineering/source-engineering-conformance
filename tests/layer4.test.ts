/**
 * TC-L4 test cases (RFC-0005, Layer 4 audit trail floor).
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { run } from "../src/runner.js";
import type { Cots } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "..", "src", "fixtures");

const load = (name: string): Cots => {
  const p = resolve(FIXTURES, name);
  return JSON.parse(readFileSync(p, "utf-8"));
};

describe("TC-L4: Layer 4 audit trail (RFC-0005)", () => {
  it("TC-L4-01: passes for a complete audit trail", () => {
    const result = run(load("l4-conformant.json"));
    const errors = result.errors.filter((e) => e.test_id === "TC-L4-01");
    expect(errors).toHaveLength(0);
  });

  it("TC-L4-02: passes for unique ids in monotonic order; fails on duplicates", () => {
    const ok = run(load("l4-conformant.json"));
    expect(ok.errors.filter((e) => e.test_id === "TC-L4-02")).toHaveLength(0);
    const bad = run(load("l4-non-append-only.json"));
    const errors = bad.errors.filter((e) => e.test_id === "TC-L4-02");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("append-only");
  });

  it("TC-L4-03: fails when a lifecycle event names an unknown decision", () => {
    const result = run(load("l4-dangling-event.json"));
    const errors = result.errors.filter((e) => e.test_id === "TC-L4-03");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("urn:source-engineering:decision:nope");
  });

  it("TC-L4-04: fails when a rerun lacks rerun_of linkage to a known decision", () => {
    const result = run(load("l4-rerun-unlinked.json"));
    const errors = result.errors.filter((e) => e.test_id === "TC-L4-04");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("rerun_of");
  });

  it("TC-L4-05: a created-only history passes with a legacy warning", () => {
    const result = run(load("l4-legacy.json"));
    expect(result.status).toBe("pass");
    const warnings = result.warnings.filter((w) => w.test_id === "TC-L4-05");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain("pre-RFC-0005");
  });

  it("the conformant fixture has no TC-L4 errors end-to-end", () => {
    const result = run(load("l4-conformant.json"));
    const errors = result.errors.filter((e) => e.test_id.startsWith("TC-L4"));
    expect(errors).toHaveLength(0);
  });
});
