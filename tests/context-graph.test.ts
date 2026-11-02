/**
 * TC-CG test cases (RFC-0004, context graph surfacing contract).
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

describe("TC-CG: context graph surfacing (RFC-0004)", () => {
  it("TC-CG-01: passes when every context parameter is recorded and surfaceable", () => {
    const result = run(load("conformant.json"));
    const errors = result.errors.filter((e) => e.test_id === "TC-CG-01");
    expect(errors).toHaveLength(0);
  });

  it("TC-CG-01: fails when a parameter is missing and cannot be surfaced", () => {
    const result = run(load("cg-missing-param.json"));
    const errors = result.errors.filter((e) => e.test_id === "TC-CG-01");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("temperature");
  });

  it("TC-CG-02: passes when every constraint has a valid id", () => {
    const result = run(load("conformant.json"));
    const errors = result.errors.filter((e) => e.test_id === "TC-CG-02");
    expect(errors).toHaveLength(0);
  });

  it("TC-CG-02: fails when a constraint id is not a valid URI", () => {
    const result = run(load("cg-bad-constraint.json"));
    const errors = result.errors.filter((e) => e.test_id === "TC-CG-02");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("not-a-uri");
  });

  it("TC-CG-03: passes when every decision has an evidence chain to contextualise", () => {
    const result = run(load("conformant.json"));
    const errors = result.errors.filter((e) => e.test_id === "TC-CG-03");
    expect(errors).toHaveLength(0);
  });

  it("TC-CG-03: fails when a decision has no evidence chain", () => {
    const result = run(load("cg-no-chain.json"));
    const errors = result.errors.filter((e) => e.test_id === "TC-CG-03");
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("contextualised");
  });
});
