/**
 * Context Graph integrity validators. Implements TC-CG-01 (context
 * parameters surfaced), TC-CG-02 (constraints surfaced), TC-CG-03
 * (contextualises edges to decisions), per RFC-0004.
 *
 * The Context Graph is derived from the COTS alone; these validators check
 * the data-level contract that makes the derivation complete: every
 * parameter key is present, every constraint is declared, and every
 * decision is linked to the context.
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 */

import type { Cots } from "../types.js";
import { type Result, combine, fail } from "../result.js";

/** TC-CG-01: every context parameter is recorded and therefore surfaceable. */
export const validateContextParametersSurfaced = (cots: Cots): Result => {
  const errors: Result[] = [];
  const p = cots.context.parameters;

  const required: Array<[string, unknown]> = [
    ["temperature", p.temperature],
    ["top_p", p.top_p],
    ["prompt_cache_id", p.prompt_cache_id],
    ["tool_budget", p.tool_budget],
    ["retrieval_depth", p.retrieval_depth],
  ];

  for (const [key, value] of required) {
    if (value === undefined) {
      errors.push(
        fail("TC-CG-01", `context.parameters.${key} is missing; it cannot be surfaced in the Context Graph`)
      );
    }
  }

  for (const key of Object.keys(p.additional ?? {})) {
    if (p.additional?.[key] === undefined) {
      errors.push(
        fail("TC-CG-01", `context.parameters.additional.${key} is present but undefined; it cannot be surfaced`)
      );
    }
  }

  return combine(...errors);
};

/** TC-CG-02: every constraint is declared with an id so it can carry a constrains edge. */
export const validateConstraintsSurfaced = (cots: Cots): Result => {
  const errors: Result[] = [];

  for (let i = 0; i < cots.context.constraints.length; i++) {
    const c = cots.context.constraints[i];
    if (!c.id || !/^[a-z][a-z0-9+\-.]*:/i.test(c.id)) {
      errors.push(
        fail("TC-CG-02", `context.constraints[${i}].id is missing or not a valid URI ('${c.id}'); the constraint cannot be surfaced in the Context Graph`)
      );
    }
  }

  return combine(...errors);
};

/** TC-CG-03: every decision is made under the recorded context. */
export const validateDecisionsContextualised = (cots: Cots): Result => {
  const errors: Result[] = [];

  if (cots.decisions.length === 0) {
    return combine();
  }

  const paramKeys = Object.keys(cots.context.parameters).filter(
    (k) => k !== "additional"
  );
  if (paramKeys.length === 0) {
    errors.push(
      fail("TC-CG-03", "context.parameters has no named parameters; no contextualises edge can be drawn to any decision")
    );
  }

  for (let i = 0; i < cots.decisions.length; i++) {
    const d = cots.decisions[i];
    const chain = cots.evidence.evidence_chain.find((c) => c.decision_id === d.id);
    if (!chain) {
      errors.push(
        fail("TC-CG-03", `decisions[${i}] (${d.id}) has no evidence chain; the decision cannot be contextualised in the Context Graph`)
      );
    }
  }

  return combine(...errors);
};
