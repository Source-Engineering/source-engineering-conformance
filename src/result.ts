/**
 * Result type for validators. Each validator returns a Result with a
 * status (pass or fail), a list of warnings, and a list of errors.
 *
 * Errors are blocking: a COTS with an error is not conformant.
 * Warnings are non-blocking: a COTS with a warning is conformant but
 * the user should review.
 */

export type ResultStatus = "pass" | "fail";

export interface ResultEntry {
  test_id: string;
  message: string;
}

export interface Result {
  status: ResultStatus;
  errors: ResultEntry[];
  warnings: ResultEntry[];
}

export const pass = (): Result => ({ status: "pass", errors: [], warnings: [] });

export const fail = (test_id: string, message: string): Result => ({
  status: "fail",
  errors: [{ test_id, message }],
  warnings: [],
});

export const warn = (test_id: string, message: string): Result => ({
  status: "pass",
  errors: [],
  warnings: [{ test_id, message }],
});

export const combine = (...results: Result[]): Result => {
  const errors = results.flatMap((r) => r.errors);
  const warnings = results.flatMap((r) => r.warnings);
  return {
    status: errors.length > 0 ? "fail" : "pass",
    errors,
    warnings,
  };
};
