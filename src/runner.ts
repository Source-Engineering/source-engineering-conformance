/**
 * The COTS runner. Loads a COTS from a path, runs all validators, returns
 * a combined Result.
 *
 * Usage:
 *   import { run } from "./runner.js";
 *   const result = run(cotsObject);
 *   console.log(result);
 */

import type { Cots } from "./types.js";
import { type Result, combine } from "./result.js";
import { validateSourceAddresses } from "./contracts/source-integrity.js";
import { validateContextRecorded, validateSourceValidity } from "./contracts/contextual-integrity.js";
import { validateEvidenceChain } from "./contracts/evidential-integrity.js";
import { validateDecisionBasis, validateCounterevidence } from "./contracts/decision-integrity.js";
import { validateAuditHistory, validateAuditHistoryOrdered } from "./contracts/lifecycle-integrity.js";
import { validateFiveParts, validateFeedbackSurfaces } from "./contracts/five-parts.js";
import { validateLayer2Records } from "./contracts/layer2-integrity.js";
import { validateUrnGrammar, validateChainResolution, validateTemporalOrdering, validateRecursiveChains } from "./contracts/semantic-integrity.js";
import { validateGuardrailDecisions } from "./contracts/layer3-integrity.js";

export const run = (cots: Cots): Result => {
  return combine(
    validateSourceAddresses(cots),
    validateContextRecorded(cots),
    validateSourceValidity(cots),
    validateEvidenceChain(cots),
    validateDecisionBasis(cots),
    validateCounterevidence(cots),
    validateAuditHistory(cots),
    validateAuditHistoryOrdered(cots),
    validateFiveParts(cots),
    validateFeedbackSurfaces(cots),
    validateLayer2Records(cots),
    validateUrnGrammar(cots),
    validateChainResolution(cots),
    validateTemporalOrdering(cots),
    validateRecursiveChains(cots),
    validateGuardrailDecisions(cots)
  );
};

export const format = (result: Result): string => {
  const lines: string[] = [];
  lines.push(`Status: ${result.status.toUpperCase()}`);
  lines.push(`Errors: ${result.errors.length}`);
  lines.push(`Warnings: ${result.warnings.length}`);
  for (const e of result.errors) {
    lines.push(`  [ERROR] ${e.test_id}: ${e.message}`);
  }
  for (const w of result.warnings) {
    lines.push(`  [WARN]  ${w.test_id}: ${w.message}`);
  }
  return lines.join("\n");
};
