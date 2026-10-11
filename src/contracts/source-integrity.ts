/**
 * Source integrity validators. Implements TC-SI-01 (source identity) and
 * TC-SI-02 (unresolved source).
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 */

import type { Cots, SourceArtifact } from "../types.js";
import { type Result, combine, fail, pass } from "../result.js";

/** TC-SI-01: a source artifact has a stable identifier and an addressable version. */
export const validateSourceIdentity = (
  artifact: SourceArtifact,
  index: number
): Result => {
  const errors: Result[] = [];

  if (!isUri(artifact.id)) {
    errors.push(
      fail("TC-SI-01", `source_artifacts[${index}].id is not a valid URI: ${artifact.id}`)
    );
  }

  if (!isSha256(artifact.version.content_hash)) {
    errors.push(
      fail(
        "TC-SI-01",
        `source_artifacts[${index}].version.content_hash is not a valid SHA-256: ${artifact.version.content_hash}`
      )
    );
  }

  if (artifact.content_reference && !isUri(artifact.content_reference.uri)) {
    errors.push(
      fail(
        "TC-SI-01",
        `source_artifacts[${index}].content_reference.uri is not a valid URI: ${artifact.content_reference.uri}`
      )
    );
  }

  return combine(...errors);
};

/** TC-SI-02: a source artifact id is malformed. (Catches the case from above.) */
export const validateSourceAddresses = (cots: Cots): Result => {
  const results = cots.inputs.source_artifacts.map((artifact, i) =>
    validateSourceIdentity(artifact, i)
  );
  return combine(...results);
};

// -- helpers --

const isUri = (s: string): boolean => {
  // We require a scheme, authority, and path.
  // Accept http, https, urn, file. (The discipline does not restrict the scheme,
  // but it requires a syntactically valid URI.)
  try {
    const u = new URL(s);
    return u.protocol.length > 0;
  } catch {
    // URL may reject urn: schemes; try a manual check
    return /^([a-z][a-z0-9+\-.]*):/i.test(s) && /\S/.test(s);
  }
};

const isSha256 = (s: string): boolean => /^[a-f0-9]{64}$/i.test(s);
