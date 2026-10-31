/**
 * Layer 3 GuardrailDecision validators. Implements TC-L3-01..07.
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 * See: RFC-0003 (v0.4 floor: Layer 3 business guardrails).
 */

import type { Cots } from "../types.js";
import { type Result, combine, fail, pass } from "../result.js";

const OUTCOMES = ["accepted", "rejected", "annotated", "escalated"] as const;

const isIso8601 = (value: string): boolean => !Number.isNaN(Date.parse(value));

/**
 * TC-L3-01..07. Validates every DecisionRecord's optional `guardrail`
 * field. The field is optional: a missing field passes (TC-L3-07).
 */
export const validateGuardrailDecisions = (cots: Cots): Result => {
  const errors: Result[] = [];

  cots.decisions.forEach((decision, index) => {
    const g = decision.guardrail;
    if (g === undefined) {
      return;
    }

    if (!(OUTCOMES as readonly string[]).includes(g.decision)) {
      errors.push(
        fail(
          "TC-L3-02",
          `decisions[${index}].guardrail.decision '${g.decision}' is not in the declared enum (accepted, rejected, annotated, escalated)`
        )
      );
    }

    if (g.decision === "rejected" && g.binding !== true) {
      errors.push(
        fail(
          "TC-L3-03",
          `decisions[${index}].guardrail: decision is 'rejected' but binding is false. Only a binding rule can reject.`
        )
      );
    }

    if (g.decision === "annotated" && g.binding === true) {
      errors.push(
        fail(
          "TC-L3-04",
          `decisions[${index}].guardrail: decision is 'annotated' but binding is true. An advisory rule annotates; it does not carry binding force.`
        )
      );
    }

    if (typeof g.rationale !== "string" || g.rationale.trim().length === 0) {
      errors.push(
        fail("TC-L3-05", `decisions[${index}].guardrail.rationale is missing or empty. Every GuardrailDecision is recorded with its rationale.`)
      );
    }

    if (!isIso8601(g.evaluated_at)) {
      errors.push(
        fail("TC-L3-01", `decisions[${index}].guardrail.evaluated_at is not a valid ISO-8601 timestamp`)
      );
    }

    if (!/^urn:source-engineering:rule:/.test(g.rule_id)) {
      errors.push(
        fail("TC-L3-01", `decisions[${index}].guardrail.rule_id '${g.rule_id}' is not a well-formed rule URN (urn:source-engineering:rule:...)`)
      );
    }

    const status = decision.validation_status.status;
    if (g.decision === "rejected" && status !== "superseded") {
      errors.push(
        fail(
          "TC-L3-06",
          `decisions[${index}].guardrail: decision is 'rejected' but validation_status.status is '${status}'; it MUST be 'superseded'`
        )
      );
    }
    if (g.decision === "escalated" && status !== "appealed") {
      errors.push(
        fail(
          "TC-L3-06",
          `decisions[${index}].guardrail: decision is 'escalated' but validation_status.status is '${status}'; it MUST be 'appealed'`
        )
      );
    }
  });

  return errors.length > 0 ? combine(...errors) : pass();
};
