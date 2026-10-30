/**
 * Semantic integrity test cases (TC-SEM-01..03) and recursive chain test
 * cases (TC-RC-01..05), derived from the canonical test cases in the
 * Source Engineering specifications and RFC-0002.
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  validateUrnGrammar,
  validateChainResolution,
  validateTemporalOrdering,
  validateRecursiveChains,
} from "../src/contracts/semantic-integrity.js";
import { run } from "../src/runner.js";
import type { Cots } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "..", "src", "fixtures");

const load = (name: string): Cots =>
  JSON.parse(readFileSync(resolve(FIXTURES, name), "utf-8")) as Cots;

describe("Semantic integrity", () => {
  it("TC-SEM-01: well-formed URNs pass", () => {
    const result = validateUrnGrammar(load("conformant.json"));
    expect(result.errors).toHaveLength(0);
  });

  it("TC-SEM-01: a malformed URN fails", () => {
    const result = validateUrnGrammar(load("sem-bad-urn.json"));
    expect(result.errors.some((e) => e.test_id === "TC-SEM-01")).toBe(true);
  });

  it("TC-SEM-02: resolving references pass", () => {
    const result = validateChainResolution(load("conformant.json"));
    expect(result.errors).toHaveLength(0);
  });

  it("TC-SEM-02: a dangling source reference fails", () => {
    const result = validateChainResolution(load("sem-dangling-source.json"));
    expect(result.errors.some((e) => e.test_id === "TC-SEM-02")).toBe(true);
  });

  it("TC-SEM-03: consistent timestamps pass", () => {
    const result = validateTemporalOrdering(load("conformant.json"));
    expect(result.errors).toHaveLength(0);
  });

  it("TC-SEM-03: evidence from the future fails", () => {
    const result = validateTemporalOrdering(load("sem-future-evidence.json"));
    expect(result.errors.some((e) => e.test_id === "TC-SEM-03")).toBe(true);
  });
});

describe("Recursive evidence chains (RFC-0002)", () => {
  it("TC-RC-04: a terminal COTS with a model-generated evidence item fails", () => {
    const result = validateRecursiveChains(load("rc-terminal-violated.json"));
    expect(result.errors.some((e) => e.test_id === "TC-RC-04")).toBe(true);
  });

  it("TC-RC-01/02: bounded recursion with a model-generated item passes with warnings", () => {
    const result = validateRecursiveChains(load("rc-bounded-ok.json"));
    expect(result.status).toBe("pass");
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.some((w) => w.test_id === "TC-RC-01")).toBe(true);
  });

  it("TC-RC-02: a recursion bound greater than 1 warns", () => {
    const result = validateRecursiveChains(load("rc-bounded-high.json"));
    expect(result.warnings.some((w) => w.test_id === "TC-RC-02")).toBe(true);
  });

  it("TC-RC-02: bounded recursion without a bound fails", () => {
    const result = validateRecursiveChains(load("rc-no-bound.json"));
    expect(result.errors.some((e) => e.test_id === "TC-RC-02")).toBe(true);
  });

  it("TC-RC-03: unbounded recursion warns", () => {
    const result = validateRecursiveChains(load("rc-unbounded.json"));
    expect(result.warnings.some((w) => w.test_id === "TC-RC-03")).toBe(true);
  });

  it("TC-RC-05: a legacy COTS without RFC-0002 fields warns as legacy", () => {
    const result = validateRecursiveChains(load("conformant.json"));
    expect(result.status).toBe("pass");
    expect(result.warnings.some((w) => w.test_id === "TC-RC-05")).toBe(true);
  });

  it("the full runner fails the terminal-policy violation end-to-end", () => {
    const result = run(load("rc-terminal-violated.json"));
    expect(result.status).toBe("fail");
    expect(result.errors.some((e) => e.test_id === "TC-RC-04")).toBe(true);
  });

  it("the full runner fails a malformed URN end-to-end", () => {
    const result = run(load("sem-bad-urn.json"));
    expect(result.status).toBe("fail");
  });
});
