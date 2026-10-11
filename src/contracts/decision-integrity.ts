/**
 * Decision integrity validators. Implements TC-DI-01 (decision basis) and
 * TC-DI-02 (decision without counterevidence).
 *
 * Note: the current COTS schema does not yet carry the DecisionBasis
 * structure as a first-class field (the basis_id points at a DecisionBasis
 * whose definition is in the model). This validator checks that the
 * basis_id is present and that the decisions' evidence chains carry
 * non-empty counter-evidence sections.
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 */

import type { Cots } from "../types.js";
import { type Result, combine, fail } from "../result.js";

/** TC-DI-01: every decision carries a basis_id. */
export const validateDecisionBasis = (cots: Cots): Result => {
  const errors: Result[] = [];

  for (let i = 0; i < cots.decisions.length; i++) {
    const d = cots.decisions[i];
    if (!d.basis_id || !d.basis_id.startsWith("urn:source-engineering:basis:")) {
      errors.push(
        fail(
          "TC-DI-01",
          `decisions[${i}].basis_id is missing or not a basis URI: ${d.basis_id}`
        )
      );
    }
  }

  return combine(...errors);
};

/** TC-DI-02: every decision considers counter-evidence. */
export const validateCounterevidence = (cots: Cots): Result => {
  const errors: Result[] = [];

  for (let i = 0; i < cots.evidence.evidence_chain.length; i++) {
    const chain = cots.evidence.evidence_chain[i];
    if (chain.contradicting_evidence.length === 0) {
      errors.push(
        fail(
          "TC-DI-02",
          `evidence.evidence_chain[${i}] (decision ${chain.decision_id}) has no counter-evidence`
        )
      );
    }
  }

  return combine(...errors);
};
