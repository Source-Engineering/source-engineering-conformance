/**
 * The Vitest test cases. Each test is derived from a canonical test case
 * in the Source Engineering specifications.
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 * See: https://github.com/Source-Engineering/source-engineering-architecture/blob/main/blueprints/v0.1/README.md
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

// =====================================================================
// Compatibility test cases (from compatibility-test-suite.md)
// =====================================================================

describe("TC-SI: source integrity", () => {
  it("TC-SI-01: passes for a COTS with a valid source artifact", () => {
    const result = run(load("conformant.json"));
    const siErrors = result.errors.filter((e) => e.test_id === "TC-SI-01");
    expect(siErrors).toHaveLength(0);
  });

  it("TC-SI-02: fails when a source id is malformed", () => {
    const result = run(load("malformed.json"));
    const siErrors = result.errors.filter((e) => e.test_id === "TC-SI-01");
    expect(siErrors.length).toBeGreaterThan(0);
    expect(siErrors[0].message).toContain("not-a-uri");
  });
});

describe("TC-CI: contextual integrity", () => {
  it("TC-CI-01: passes for a COTS with a complete context", () => {
    const result = run(load("conformant.json"));
    const ciErrors = result.errors.filter((e) => e.test_id === "TC-CI-01");
    expect(ciErrors).toHaveLength(0);
  });

  it("TC-CI-02: passes for a COTS whose source is currently valid", () => {
    const result = run(load("conformant.json"));
    const ciErrors = result.errors.filter((e) => e.test_id === "TC-CI-02");
    expect(ciErrors).toHaveLength(0);
  });

  it("TC-CI-03: warns when a source has expired before the decision", () => {
    const result = run(load("expired-source.json"));
    expect(result.status).toBe("pass"); // warning, not error
    const ciWarnings = result.warnings.filter((w) => w.test_id === "TC-CI-03");
    expect(ciWarnings.length).toBeGreaterThan(0);
  });
});

describe("TC-EI: evidential integrity", () => {
  it("TC-EI-01: passes for a COTS with a complete evidence chain", () => {
    const result = run(load("conformant.json"));
    const eiErrors = result.errors.filter((e) => e.test_id === "TC-EI-01");
    expect(eiErrors).toHaveLength(0);
  });

  it("TC-EI-02: fails when a claim has no supporting or contradicting evidence", () => {
    const result = run(load("malformed.json"));
    const eiErrors = result.errors.filter((e) => e.test_id === "TC-EI-02");
    expect(eiErrors.length).toBeGreaterThan(0);
  });
});

describe("TC-DI: decision integrity", () => {
  it("TC-DI-01: passes for a COTS whose decision carries a basis_id", () => {
    const result = run(load("conformant.json"));
    const diErrors = result.errors.filter((e) => e.test_id === "TC-DI-01");
    expect(diErrors).toHaveLength(0);
  });

  it("TC-DI-02: fails when a decision has no counterevidence", () => {
    const result = run(load("malformed.json"));
    const diErrors = result.errors.filter((e) => e.test_id === "TC-DI-02");
    expect(diErrors.length).toBeGreaterThan(0);
  });
});

describe("TC-LI: lifecycle integrity", () => {
  it("TC-LI-01: passes for a COTS with a complete audit history", () => {
    const result = run(load("conformant.json"));
    const liErrors = result.errors.filter((e) => e.test_id === "TC-LI-01");
    expect(liErrors).toHaveLength(0);
  });

  it("TC-LI-02: passes for a COTS whose audit history is in time order", () => {
    const result = run(load("conformant.json"));
    const liErrors = result.errors.filter((e) => e.test_id === "TC-LI-02");
    expect(liErrors).toHaveLength(0);
  });
});

describe("TC-FF: five-part completeness", () => {
  it("TC-FF-01: passes for a COTS with all five parts", () => {
    const result = run(load("conformant.json"));
    const ffErrors = result.errors.filter((e) => e.test_id === "TC-FF-01");
    expect(ffErrors).toHaveLength(0);
  });

  it("TC-FF-02: warns when feedback surfaces are missing", () => {
    const result = run(load("malformed.json"));
    const ffWarnings = result.warnings.filter((w) => w.test_id === "TC-FF-02");
    expect(ffWarnings.length).toBeGreaterThan(0);
  });
});

// =====================================================================
// Top-level: conformant vs malformed
// =====================================================================

describe("full COTS validation", () => {
  it("returns pass for a conformant COTS", () => {
    const result = run(load("conformant.json"));
    expect(result.status).toBe("pass");
    expect(result.errors).toHaveLength(0);
  });

  it("returns fail for a malformed COTS with multiple integrity violations", () => {
    const result = run(load("malformed.json"));
    expect(result.status).toBe("fail");
    expect(result.errors.length).toBeGreaterThan(2);
  });
});
