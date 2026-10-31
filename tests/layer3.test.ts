/**
 * Layer 3 GuardrailDecision test cases (TC-L3-01..07), derived from the
 * canonical test cases in the Source Engineering specifications and RFC-0003.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateGuardrailDecisions } from "../src/contracts/layer3-integrity.js";
import { run } from "../src/runner.js";
import type { Cots } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "..", "src", "fixtures");

const load = (name: string): Cots =>
  JSON.parse(readFileSync(resolve(FIXTURES, name), "utf-8")) as Cots;

describe("Layer 3 GuardrailDecisions", () => {
  it("TC-L3-01: well-formed guardrail records pass (accepted, rejected, annotated, escalated)", () => {
    for (const f of ["l3-accepted.json", "l3-rejected.json", "l3-annotated.json", "l3-escalated.json"]) {
      const result = validateGuardrailDecisions(load(f));
      expect(result.errors, f).toHaveLength(0);
    }
  });

  it("TC-L3-02: an unknown guardrail decision fails", () => {
    const result = validateGuardrailDecisions(load("l3-bad-decision.json"));
    expect(result.errors.some((e) => e.test_id === "TC-L3-02")).toBe(true);
  });

  it("TC-L3-03: a rejection that is not binding fails", () => {
    const result = validateGuardrailDecisions(load("l3-rejected-not-binding.json"));
    expect(result.errors.some((e) => e.test_id === "TC-L3-03")).toBe(true);
  });

  it("TC-L3-04: an annotation marked binding fails", () => {
    const result = validateGuardrailDecisions(load("l3-annotated-binding.json"));
    expect(result.errors.some((e) => e.test_id === "TC-L3-04")).toBe(true);
  });

  it("TC-L3-05: an empty rationale fails", () => {
    const result = validateGuardrailDecisions(load("l3-no-rationale.json"));
    expect(result.errors.some((e) => e.test_id === "TC-L3-05")).toBe(true);
  });

  it("TC-L3-06: a rejected decision whose status is not superseded fails", () => {
    const result = validateGuardrailDecisions(load("l3-status-inconsistent.json"));
    expect(result.errors.some((e) => e.test_id === "TC-L3-06")).toBe(true);
  });

  it("TC-L3-07: a v1.2.0 COTS without the guardrail field passes", () => {
    const result = validateGuardrailDecisions(load("conformant.json"));
    expect(result.errors).toHaveLength(0);
  });

  it("the full runner fails the non-binding rejection end-to-end", () => {
    const result = run(load("l3-rejected-not-binding.json"));
    expect(result.status).toBe("fail");
  });

  it("the full runner passes the well-formed rejection end-to-end", () => {
    const result = run(load("l3-rejected.json"));
    expect(result.errors.filter((e) => e.test_id.startsWith("TC-L3"))).toHaveLength(0);
  });
});
