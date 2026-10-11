/**
 * Lifecycle integrity validators. Implements TC-LI-01 (audit history)
 * and TC-LI-02 (audit history append-only).
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/compatibility-test-suite.md
 */

import type { Cots, AuditEntry } from "../types.js";
import { type Result, combine, fail } from "../result.js";

/** TC-LI-01: every decision record carries a complete audit trail starting with a "created" entry. */
export const validateAuditHistory = (cots: Cots): Result => {
  const errors: Result[] = [];

  for (let i = 0; i < cots.decisions.length; i++) {
    const history = cots.decisions[i].audit_history;
    if (history.length === 0) {
      errors.push(
        fail(
          "TC-LI-01",
          `decisions[${i}] has an empty audit_history (must contain at least a "created" entry)`
        )
      );
      continue;
    }
    const first = history[0];
    if (first.action !== "created") {
      errors.push(
        fail(
          "TC-LI-01",
          `decisions[${i}].audit_history[0] is not "created" (got "${first.action}")`
        )
      );
    }
  }

  return combine(...errors);
};

/** TC-LI-02: the audit history is in monotonic time order (proxy for append-only). */
export const validateAuditHistoryOrdered = (cots: Cots): Result => {
  const errors: Result[] = [];

  for (let i = 0; i < cots.decisions.length; i++) {
    const history: AuditEntry[] = cots.decisions[i].audit_history;
    for (let j = 1; j < history.length; j++) {
      const prev = Date.parse(history[j - 1].performed_at);
      const curr = Date.parse(history[j].performed_at);
      if (Number.isNaN(prev) || Number.isNaN(curr)) {
        errors.push(
          fail(
            "TC-LI-02",
            `decisions[${i}].audit_history[${j}] has an unparseable timestamp`
          )
        );
        continue;
      }
      if (curr < prev) {
        errors.push(
          fail(
            "TC-LI-02",
            `decisions[${i}].audit_history[${j}] is earlier than the previous entry (not append-only)`
          )
        );
      }
    }
  }

  return combine(...errors);
};
