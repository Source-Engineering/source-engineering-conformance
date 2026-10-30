/**
 * Layer 2 Validation record test cases (TC-L2-01..06), derived from the
 * canonical test cases in the Source Engineering specifications.
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateLayer2Records } from "../src/contracts/layer2-integrity.js";
import { run } from "../src/runner.js";
import type { Cots } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "..", "src", "fixtures");

const load = (name: string): Cots => {
  const p = resolve(FIXTURES, name);
  return JSON.parse(readFileSync(p, "utf-8")) as Cots;
};

describe("Layer 2 Validation records", () => {
  it("TC-L2-01: a well-formed Validation record passes", () => {
    const result = validateLayer2Records(load("layer2-conformant.json"));
    expect(result.errors).toHaveLength(0);
  });

  it("TC-L2-02: an unknown flag_type fails", () => {
    const result = validateLayer2Records(load("layer2-bad-flag-type-full.json"));
    expect(result.errors.some((e) => e.test_id === "TC-L2-02")).toBe(true);
  });

  it("TC-L2-03: an unknown decision_on_validation fails (Layer 2 does not reject)", () => {
    const result = validateLayer2Records(load("layer2-bad-decision.json"));
    expect(result.errors.some((e) => e.test_id === "TC-L2-03")).toBe(true);
  });

  it("TC-L2-04: flags inconsistent with decision_on_validation fail", () => {
    const result = validateLayer2Records(load("layer2-mismatch.json"));
    expect(result.errors.some((e) => e.test_id === "TC-L2-04")).toBe(true);
  });

  it("TC-L2-05: a malformed validated_at fails", () => {
    const result = validateLayer2Records(load("layer2-bad-timestamp.json"));
    expect(result.errors.some((e) => e.test_id === "TC-L2-05")).toBe(true);
  });

  it("TC-L2-06: a v1.0.0 COTS without the validation field passes", () => {
    const result = validateLayer2Records(load("conformant.json"));
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("the full runner passes the conformant Layer 2 fixture end-to-end", () => {
    const result = run(load("layer2-conformant.json"));
    expect(result.errors).toHaveLength(0);
  });

  it("the full runner fails the flag/decision mismatch end-to-end", () => {
    const result = run(load("layer2-mismatch.json"));
    expect(result.errors.some((e) => e.test_id === "TC-L2-04")).toBe(true);
  });
});
