/**
 * Contextual integrity validators. Implements TC-CI-01 (context recorded),
 * TC-CI-02 (source validity), TC-CI-03 (expired source).
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 */

import type { Cots, SourceArtifact } from "../types.js";
import { type Result, combine, fail, pass, warn } from "../result.js";

/** TC-CI-01: the context records the runtime parameters. */
export const validateContextRecorded = (cots: Cots): Result => {
  const errors: Result[] = [];

  if (!cots.context.model.model_name) {
    errors.push(fail("TC-CI-01", "context.model.model_name is empty"));
  }

  if (!cots.context.model.model_version) {
    errors.push(fail("TC-CI-01", "context.model.model_version is empty"));
  }

  if (typeof cots.context.parameters.temperature !== "number") {
    errors.push(
      fail("TC-CI-01", "context.parameters.temperature is not a number")
    );
  }

  if (typeof cots.context.parameters.top_p !== "number") {
    errors.push(
      fail("TC-CI-01", "context.parameters.top_p is not a number")
    );
  }

  if (typeof cots.context.parameters.tool_budget !== "number") {
    errors.push(
      fail("TC-CI-01", "context.parameters.tool_budget is not a number")
    );
  }

  if (typeof cots.context.parameters.retrieval_depth !== "number") {
    errors.push(
      fail("TC-CI-01", "context.parameters.retrieval_depth is not a number")
    );
  }

  return combine(...errors);
};

/** TC-CI-02 / TC-CI-03: each source's temporal validity is checked against the decision's timestamp. */
export const validateSourceValidity = (cots: Cots): Result => {
  const produced = Date.parse(cots.produced_at);
  if (Number.isNaN(produced)) {
    return fail("TC-CI-02", `cots.produced_at is not a valid ISO-8601 timestamp: ${cots.produced_at}`);
  }

  const errors: Result[] = [];
  const warnings: Result[] = [];

  for (let i = 0; i < cots.inputs.source_artifacts.length; i++) {
    const artifact: SourceArtifact = cots.inputs.source_artifacts[i];
    const validUntil = artifact.temporal_validity.valid_until;
    if (validUntil === null) continue;

    const validUntilMs = Date.parse(validUntil);
    if (Number.isNaN(validUntilMs)) {
      errors.push(
        fail(
          "TC-CI-02",
          `source_artifacts[${i}].temporal_validity.valid_until is not a valid ISO-8601 timestamp: ${validUntil}`
        )
      );
      continue;
    }

    if (validUntilMs < produced) {
      warnings.push(
        warn(
          "TC-CI-03",
          `source_artifacts[${i}] (${artifact.id}) was not valid at the time of the decision (expired ${validUntil}, decided ${cots.produced_at})`
        )
      );
    }
  }

  return combine(...errors, ...warnings);
};
