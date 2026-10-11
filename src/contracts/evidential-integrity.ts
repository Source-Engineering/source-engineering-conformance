/**
 * Evidential integrity validators. Implements TC-EI-01 (evidence chain) and
 * TC-EI-02 (unsupported claim).
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 */

import type { Cots, Claim, EvidenceItem, URI } from "../types.js";
import { type Result, combine, fail, pass } from "../result.js";

/** TC-EI-01: every claim carries at least one evidence item, and each item has a provenance back to a source. */
export const validateEvidenceChain = (cots: Cots): Result => {
  const errors: Result[] = [];
  const sourceIds = new Set(cots.inputs.source_artifacts.map((a) => a.id));

  // Build a flat index of evidence items.
  const allEvidence: { item: EvidenceItem; decisionIndex: number; claimId: URI }[] = [];
  for (let d = 0; d < cots.evidence.evidence_chain.length; d++) {
    const chain = cots.evidence.evidence_chain[d];
    for (const item of chain.supporting_evidence) {
      allEvidence.push({ item, decisionIndex: d, claimId: item.claim_id });
    }
    for (const item of chain.contradicting_evidence) {
      allEvidence.push({ item, decisionIndex: d, claimId: item.claim_id });
    }
  }

  // Every evidence item's source_id must resolve to a source artifact.
  for (const { item, decisionIndex } of allEvidence) {
    if (!sourceIds.has(item.source_id)) {
      errors.push(
        fail(
          "TC-EI-01",
          `evidence.evidence_chain[${decisionIndex}].evidence item ${item.id} references unknown source ${item.source_id}`
        )
      );
    }
    if (!item.transformation) {
      errors.push(
        fail(
          "TC-EI-01",
          `evidence.evidence_chain[${decisionIndex}].evidence item ${item.id} is missing a transformation`
        )
      );
    }
    if (!item.uncertainty) {
      errors.push(
        fail(
          "TC-EI-01",
          `evidence.evidence_chain[${decisionIndex}].evidence item ${item.id} is missing an uncertainty`
        )
      );
    }
  }

  // Every claim must reference at least one supporting OR contradicting evidence item.
  for (let d = 0; d < cots.evidence.evidence_chain.length; d++) {
    const chain = cots.evidence.evidence_chain[d];
    for (const claim of chain.claims) {
      if (claim.supporting_evidence.length === 0 && claim.contradicting_evidence.length === 0) {
        errors.push(
          fail(
            "TC-EI-02",
            `claim ${claim.id} in decision ${chain.decision_id} has no supporting or contradicting evidence`
          )
        );
      }
    }
  }

  return combine(...errors);
};

/** TC-EI-02: every claim has at least one evidence item (covered above). */
export const validateClaimsHaveEvidence = (cots: Cots): Result => pass();
