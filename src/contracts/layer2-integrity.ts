/**
 * Layer 2 Validation record validators. Implements TC-L2-01..06.
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 * See: RFC-0001 (v0.2 floor: Layer 2).
 */

import type { Cots } from "../types.js";
import { type Result, combine, fail, pass } from "../result.js";

const FLAG_TYPES = [
  "drift-detected",
  "segment-signal-divergence",
  "parameter-set-out-of-range",
  "temporal-validity-expired",
] as const;

const DECISIONS_ON_VALIDATION = ["passed", "flagged", "escalated"] as const;

const isIso8601 = (value: string): boolean => !Number.isNaN(Date.parse(value));

/**
 * TC-L2-01 .. TC-L2-06. Validates every DecisionRecord's optional
 * `validation` field. The field is optional: a missing field passes
 * (TC-L2-06, the producer has not floored Layer 2).
 */
export const validateLayer2Records = (cots: Cots): Result => {
  const errors: Result[] = [];

  cots.decisions.forEach((decision, index) => {
    const v = decision.validation;
    if (v === undefined) {
      return;
    }

    if (!Array.isArray(v.flags)) {
      errors.push(fail("TC-L2-01", `decisions[${index}].validation.flags is not an array`));
      return;
    }

    v.flags.forEach((flag, fIndex) => {
      if (!(FLAG_TYPES as readonly string[]).includes(flag.flag_type)) {
        errors.push(
          fail(
            "TC-L2-02",
            `decisions[${index}].validation.flags[${fIndex}].flag_type '${flag.flag_type}' is not in the declared enum`
          )
        );
      }
      if (!isIso8601(flag.detected_at)) {
        errors.push(
          fail(
            "TC-L2-01",
            `decisions[${index}].validation.flags[${fIndex}].detected_at is not a valid ISO-8601 timestamp`
          )
        );
      }
    });

    if (!(DECISIONS_ON_VALIDATION as readonly string[]).includes(v.decision_on_validation)) {
      errors.push(
        fail(
          "TC-L2-03",
          `decisions[${index}].validation.decision_on_validation '${v.decision_on_validation}' is not in the declared enum (passed, flagged, escalated). Layer 2 does not reject; it flags.`
        )
      );
    } else if (
      (v.flags.length > 0 && v.decision_on_validation === "passed") ||
      (v.flags.length === 0 && v.decision_on_validation !== "passed")
    ) {
      errors.push(
        fail(
          "TC-L2-04",
          `decisions[${index}].validation: decision_on_validation '${v.decision_on_validation}' is inconsistent with ${v.flags.length} flags`
        )
      );
    }

    if (!isIso8601(v.validated_at)) {
      errors.push(
        fail("TC-L2-05", `decisions[${index}].validation.validated_at is not a valid ISO-8601 timestamp`)
      );
    }

    if (typeof v.validated_by !== "string" || v.validated_by.length === 0) {
      errors.push(fail("TC-L2-01", `decisions[${index}].validation.validated_by is missing or empty`));
    }
  });

  if (errors.length === 0) {
    return pass();
  }
  return combine(...errors);
};
