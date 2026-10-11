/**
 * Five-part completeness validators. Implements TC-FF-01 (five parts present)
 * and TC-FF-02 (missing validation).
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 */

import type { Cots } from "../types.js";
import { type Result, combine, fail, pass, warn } from "../result.js";

/** TC-FF-01: the COTS has all five parts. */
export const validateFiveParts = (cots: Cots): Result => {
  const errors: Result[] = [];

  if (cots.inputs.source_artifacts.length === 0) {
    errors.push(fail("TC-FF-01", "inputs.source_artifacts is empty"));
  }
  if (cots.decisions.length === 0) {
    errors.push(fail("TC-FF-01", "decisions is empty"));
  }
  if (cots.evidence.evidence_chain.length === 0) {
    errors.push(fail("TC-FF-01", "evidence.evidence_chain is empty"));
  }
  if (cots.context.constraints === undefined) {
    errors.push(fail("TC-FF-01", "context.constraints is missing"));
  }

  return combine(...errors);
};

/** TC-FF-02: validation feedback surfaces are present. (Warning, not error.) */
export const validateFeedbackSurfaces = (cots: Cots): Result => {
  if (cots.validation.feedback_surfaces.length === 0) {
    return warn(
      "TC-FF-02",
      "validation.feedback_surfaces is empty (no appeal, rerun, or correction surfaces)"
    );
  }
  return pass();
};
