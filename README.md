# Conformance

> Conformance test suite for the Source Engineering discipline. Implements the canonical test cases from `source-engineering-specifications` and the layer-1 blueprint at `source-engineering-architecture`.

This repository holds the discipline's conformance test suite. The suite is normative: a COTS is conformant if and only if it passes the test cases here. The test cases are derived from `Source-Engineering/source-engineering-specifications/compatibility-test-suite.md` and the layer-1 blueprint at `Source-Engineering/source-engineering-architecture/blueprints/v0.1/README.md`.

## Quick start

```bash
npm install
npm test
```

The test suite runs the canonical test cases against the canonical fixtures in `src/fixtures/`.

## Validating a COTS

```bash
npx ts-node src/cli.ts validate path/to/cots.json
# or after build:
node dist/cli.js validate path/to/cots.json
```

The CLI exits with code 0 on pass, 1 on fail.

## What is in this repository

- `src/types.ts` - the COTS type definitions. Normative projection of the v0.1 schema.
- `src/result.ts` - the Result type for validators.
- `src/contracts/` - the contract validators. One TypeScript module per integrity question.
- `src/runner.ts` - the runner. Loads a COTS, runs all validators, returns a Result.
- `src/cli.ts` - the CLI. `se-conformance validate <path>`.
- `src/fixtures/` - canonical sample COTSs (conformant, malformed, expired-source).
- `tests/cots.test.ts` - the Vitest test cases.

## Test cases

| Test ID | Source |
|---|---|
| TC-SI-01 | source-integrity.ts (source identity) |
| TC-SI-02 | source-integrity.ts (unresolved source) |
| TC-CI-01 | contextual-integrity.ts (context recorded) |
| TC-CI-02 | contextual-integrity.ts (source validity) |
| TC-CI-03 | contextual-integrity.ts (expired source) |
| TC-EI-01 | evidential-integrity.ts (evidence chain) |
| TC-EI-02 | evidential-integrity.ts (unsupported claim) |
| TC-DI-01 | decision-integrity.ts (decision basis) |
| TC-DI-02 | decision-integrity.ts (no counterevidence) |
| TC-LI-01 | lifecycle-integrity.ts (audit history) |
| TC-LI-02 | lifecycle-integrity.ts (audit history append-only) |
| TC-FF-01 | five-parts.ts (five parts present) |
| TC-FF-02 | five-parts.ts (missing validation) |

## Provenance

- `Source-Engineering/source-engineering-specifications/compatibility-test-suite.md` - 12 canonical test cases.
- `Source-Engineering/source-engineering-architecture/blueprints/v0.1/README.md` - 7 layer-1 test cases (TC-L1-01..07).
- `Source-Engineering/source-engineering-model/integrity-questions.md` - the 5 integrity questions.

## Status

This is the conformance slice (Phase 3). The 12 compatibility test cases are implemented and run with Vitest. The 7 layer-1 test cases are documented; their implementation lands with the reference implementation in `source-engineering-reference-implementation`.

## License

Apache-2.0. See [LICENSE](LICENSE).
