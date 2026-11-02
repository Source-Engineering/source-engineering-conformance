/**
 * Layer 4 (Audit Trail) integrity validators. Implements TC-L4-01..05 per
 * RFC-0005: the audit trail is lifecycle-complete and append-only, not
 * merely present.
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 */

import type { Cots, AuditEntry } from "../types.js";
import { type Result, combine, fail, warn } from "../result.js";

const URN_RE = /^[a-z][a-z0-9+\-.]*:/i;

/** TC-L4-01: every decision's audit trail starts with "created" and every entry is complete. */
export const validateAuditTrailComplete = (cots: Cots): Result => {
  const errors: Result[] = [];

  for (let i = 0; i < cots.decisions.length; i++) {
    const history = cots.decisions[i].audit_history;
    if (history.length === 0) {
      errors.push(fail("TC-L4-01", `decisions[${i}].audit_history is empty (must start with "created")`));
      continue;
    }
    if (history[0].action !== "created") {
      errors.push(fail("TC-L4-01", `decisions[${i}].audit_history[0] is not "created" (got "${history[0].action}")`));
    }
    for (let j = 0; j < history.length; j++) {
      const e: AuditEntry = history[j];
      if (!e.id || !URN_RE.test(e.id)) {
        errors.push(fail("TC-L4-01", `decisions[${i}].audit_history[${j}].id is missing or not a valid URI ('${e.id}')`));
      }
      if (!e.action) {
        errors.push(fail("TC-L4-01", `decisions[${i}].audit_history[${j}].action is empty`));
      }
      if (!e.performed_by) {
        errors.push(fail("TC-L4-01", `decisions[${i}].audit_history[${j}].performed_by is empty`));
      }
      if (Number.isNaN(Date.parse(e.performed_at))) {
        errors.push(fail("TC-L4-01", `decisions[${i}].audit_history[${j}].performed_at is not a valid ISO-8601 timestamp ('${e.performed_at}')`));
      }
    }
  }

  return combine(...errors);
};

/** TC-L4-02: append-only verifiable: unique entry ids and monotonic time order. */
export const validateAuditTrailAppendOnly = (cots: Cots): Result => {
  const errors: Result[] = [];

  for (let i = 0; i < cots.decisions.length; i++) {
    const history = cots.decisions[i].audit_history;
    const seen = new Set<string>();
    for (let j = 0; j < history.length; j++) {
      const e = history[j];
      if (seen.has(e.id)) {
        errors.push(fail("TC-L4-02", `decisions[${i}].audit_history contains duplicate entry id '${e.id}' (append-only violated)`));
      }
      seen.add(e.id);
      if (j > 0) {
        const prev = Date.parse(history[j - 1].performed_at);
        const curr = Date.parse(e.performed_at);
        if (!Number.isNaN(prev) && !Number.isNaN(curr) && curr < prev) {
          errors.push(fail("TC-L4-02", `decisions[${i}].audit_history[${j}] is earlier than its predecessor (append-only violated: ${e.performed_at} < ${history[j - 1].performed_at})`));
        }
      }
    }
  }

  return combine(...errors);
};

/** TC-L4-03: every non-"created" entry names a decision that exists in the COTS. */
export const validateLifecycleEventsResolve = (cots: Cots): Result => {
  const errors: Result[] = [];
  const decisionIds = new Set(cots.decisions.map((d) => d.id));

  for (let i = 0; i < cots.decisions.length; i++) {
    for (let j = 0; j < cots.decisions[i].audit_history.length; j++) {
      const e = cots.decisions[i].audit_history[j];
      if (e.action === "created") continue;
      const m = e.notes.match(/decision_id=(\S+)/);
      if (!m) {
        errors.push(fail("TC-L4-03", `decisions[${i}].audit_history[${j}] (${e.action}) does not name a decision_id; the lifecycle event dangles`));
      } else if (!decisionIds.has(m[1])) {
        errors.push(fail("TC-L4-03", `decisions[${i}].audit_history[${j}] references unknown decision '${m[1]}'`));
      }
    }
  }

  return combine(...errors);
};

/** TC-L4-04: rerun entries link to the original decision; superseded entries name the superseding decision. */
export const validateLifecycleLinkage = (cots: Cots): Result => {
  const errors: Result[] = [];
  const decisionIds = new Set(cots.decisions.map((d) => d.id));

  for (let i = 0; i < cots.decisions.length; i++) {
    for (let j = 0; j < cots.decisions[i].audit_history.length; j++) {
      const e = cots.decisions[i].audit_history[j];
      if (e.action === "rerun") {
        const m = e.notes.match(/rerun_of=(\S+)/);
        if (!m) {
          errors.push(fail("TC-L4-04", `decisions[${i}].audit_history[${j}] is a rerun without rerun_of linkage`));
        } else if (!decisionIds.has(m[1])) {
          errors.push(fail("TC-L4-04", `decisions[${i}].audit_history[${j}] rerun_of '${m[1]}' does not resolve to a decision in the COTS`));
        }
      }
      if (e.action === "superseded") {
        const m = e.notes.match(/superseded_by=(\S+)/);
        if (!m) {
          errors.push(fail("TC-L4-04", `decisions[${i}].audit_history[${j}] is superseded without superseded_by linkage`));
        } else if (!decisionIds.has(m[1])) {
          errors.push(fail("TC-L4-04", `decisions[${i}].audit_history[${j}] superseded_by '${m[1]}' does not resolve to a decision in the COTS`));
        }
      }
    }
  }

  return combine(...errors);
};

/** TC-L4-05: a pre-RFC-0005 COTS with a created-only history passes with a legacy warning. */
export const validateLegacyAuditTrail = (cots: Cots): Result => {
  const warnings: Result[] = [];

  for (let i = 0; i < cots.decisions.length; i++) {
    const history = cots.decisions[i].audit_history;
    if (history.length === 1 && history[0].action === "created") {
      warnings.push(
        warn("TC-L4-05", `decisions[${i}] has a created-only audit history (pre-RFC-0005 producer; no lifecycle events recorded)`)
      );
    }
  }

  return combine(...warnings);
};
