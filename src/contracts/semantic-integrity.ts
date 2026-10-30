/**
 * Semantic integrity validators. Implements TC-SEM-01..03 (URN grammar,
 * evidence-chain resolution, temporal ordering) and the RFC-0002 recursive
 * chain test cases TC-RC-01..05.
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 * See: RFC-0002 (recursive evidence chains).
 */

import type { Cots } from "../types.js";
import { type Result, combine, fail, pass, warn } from "../result.js";

const URN_RE = /^urn:source-engineering:[a-z][a-z0-9-]*:[^\s]+$/;

const ts = (value: string): number => Date.parse(value);

/** TC-SEM-01: every identifier is a well-formed Source Engineering URN. */
export const validateUrnGrammar = (cots: Cots): Result => {
  const errors: Result[] = [];
  const check = (id: string, where: string) => {
    if (!URN_RE.test(id)) {
      errors.push(fail("TC-SEM-01", `${where} has a malformed URN: '${id}'`));
    }
  };

  check(cots.cots_id, "cots_id");
  cots.inputs.source_artifacts.forEach((a, i) => check(a.id, `inputs.source_artifacts[${i}].id`));
  cots.context.constraints.forEach((c, i) => check(c.id, `context.constraints[${i}].id`));
  cots.decisions.forEach((d, i) => {
    check(d.id, `decisions[${i}].id`);
    check(d.basis_id, `decisions[${i}].basis_id`);
    check(d.evidence_chain_ref, `decisions[${i}].evidence_chain_ref`);
  });
  cots.evidence.evidence_chain.forEach((chain, i) => {
    chain.decision_id && check(chain.decision_id, `evidence.evidence_chain[${i}].decision_id`);
    for (const item of [...chain.supporting_evidence, ...chain.contradicting_evidence]) {
      check(item.id, `evidence.evidence_chain[${i}] evidence item id`);
      check(item.claim_id, `evidence.evidence_chain[${i}] evidence claim_id`);
      check(item.source_id, `evidence.evidence_chain[${i}] evidence source_id`);
    }
    chain.claims.forEach((claim, ci) => {
      check(claim.id, `evidence.evidence_chain[${i}].claims[${ci}].id`);
      check(claim.decision_record_id, `evidence.evidence_chain[${i}].claims[${ci}].decision_record_id`);
    });
  });

  return errors.length > 0 ? combine(...errors) : pass();
};

/** TC-SEM-02: every reference in the evidence chain resolves within the COTS. */
export const validateChainResolution = (cots: Cots): Result => {
  const errors: Result[] = [];
  const sources = new Set(cots.inputs.source_artifacts.map((a) => a.id));
  const decisions = new Set(cots.decisions.map((d) => d.id));

  cots.evidence.evidence_chain.forEach((chain, i) => {
    if (chain.decision_id && !decisions.has(chain.decision_id)) {
      errors.push(
        fail("TC-SEM-02", `evidence.evidence_chain[${i}].decision_id '${chain.decision_id}' does not resolve to a DecisionRecord`)
      );
    }

    const evidenceIds = new Set(
      [...chain.supporting_evidence, ...chain.contradicting_evidence].map((e) => e.id)
    );
    const claimIds = new Set(chain.claims.map((c) => c.id));

    for (const item of [...chain.supporting_evidence, ...chain.contradicting_evidence]) {
      if (!sources.has(item.source_id)) {
        errors.push(
          fail("TC-SEM-02", `evidence item '${item.id}' references unresolved source '${item.source_id}'`)
        );
      }
      if (!claimIds.has(item.claim_id)) {
        errors.push(
          fail("TC-SEM-02", `evidence item '${item.id}' references unresolved claim '${item.claim_id}'`)
        );
      }
    }

    chain.claims.forEach((claim) => {
      for (const ref of [...claim.supporting_evidence, ...claim.contradicting_evidence]) {
        if (!evidenceIds.has(ref)) {
          errors.push(
            fail("TC-SEM-02", `claim '${claim.id}' references unresolved evidence '${ref}'`)
          );
        }
      }
      if (!decisions.has(claim.decision_record_id)) {
        errors.push(
          fail("TC-SEM-02", `claim '${claim.id}' references unresolved decision '${claim.decision_record_id}'`)
        );
      }
    });
  });

  return errors.length > 0 ? combine(...errors) : pass();
};

/** TC-SEM-03: timestamps are internally consistent (no evidence from the future). */
export const validateTemporalOrdering = (cots: Cots): Result => {
  const errors: Result[] = [];
  const produced = ts(cots.produced_at);

  for (const a of cots.inputs.source_artifacts) {
    if (ts(a.version.issued_at) > produced) {
      errors.push(
        fail("TC-SEM-03", `source '${a.id}' was issued after the COTS was produced (evidence from the future)`)
      );
    }
  }

  for (const d of cots.decisions) {
    if (ts(d.created_at) < produced - 24 * 3600 * 1000) {
      errors.push(
        fail("TC-SEM-03", `decision '${d.id}' was created more than a day before the COTS was produced`)
      );
    }
    const v = (d as { validation?: { validated_at?: string } }).validation;
    if (v?.validated_at !== undefined && ts(v.validated_at) < produced) {
      errors.push(
        fail("TC-SEM-03", `decision '${d.id}' was validated before the COTS was produced`)
      );
    }
  }

  return errors.length > 0 ? combine(...errors) : pass();
};

/**
 * TC-RC-01..05: recursive evidence chains per RFC-0002.
 * Returns warnings/errors for the RFC-0002 fields.
 */
export const validateRecursiveChains = (cots: Cots): Result => {
  const warnings: Result[] = [];
  const errors: Result[] = [];

  const hasFields =
    cots.evidence.chain_termination !== undefined ||
    cots.evidence.evidence_chain.some((c) =>
      [...c.supporting_evidence, ...c.contradicting_evidence].some((e) => e.source_type !== undefined)
    );

  if (!hasFields) {
    warnings.push(warn("TC-RC-05", "pre-RFC-0002 COTS: no source_type or chain_termination fields (legacy)"));
    return combine(...warnings);
  }

  const termination = cots.evidence.chain_termination;
  if (termination === undefined) {
    warnings.push(
      warn("TC-RC-05", "chain_termination is absent while source_type fields are present; treated as legacy")
    );
  } else {
    if (termination.policy === "bounded_recursion") {
      if (termination.max_levels === undefined || termination.max_levels < 1) {
        errors.push(fail("TC-RC-02", "bounded_recursion declared without a max_levels bound of at least 1"));
      } else if (termination.max_levels > 1) {
        warnings.push(
          warn("TC-RC-02", `recursion bound is ${termination.max_levels}; the recommended bound is 1`)
        );
      }
    } else if (termination.policy === "unbounded_recursion") {
      warnings.push(warn("TC-RC-03", "unbounded_recursion: chains may include any depth of model outputs"));
    }
  }

  const modelItems: string[] = [];
  for (const chain of cots.evidence.evidence_chain) {
    for (const item of [...chain.supporting_evidence, ...chain.contradicting_evidence]) {
      if (item.source_type === "model-generated") {
        modelItems.push(item.id);
      }
    }
  }

  if (modelItems.length > 0) {
    if (termination === undefined || termination.policy === "terminal") {
      errors.push(
        fail(
          "TC-RC-04",
          `chain termination policy '${termination?.policy ?? "terminal (default)"}' violated: model-generated evidence items ${modelItems.join(", ")}`
        )
      );
    } else if (termination.policy === "bounded_recursion") {
      warnings.push(
        warn("TC-RC-01", `recursive evidence: ${modelItems.length} model-generated item(s); chain is recursive`)
      );
    } else {
      warnings.push(
        warn("TC-RC-01", `recursive evidence: ${modelItems.length} model-generated item(s) under unbounded recursion`)
      );
    }
  }

  return combine(...errors, ...warnings);
};
