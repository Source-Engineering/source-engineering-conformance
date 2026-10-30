/**
 * COTS type definitions. Normative projection of the
 * Source Engineering COTS schema v0.1.
 *
 * See: https://github.com/Source-Engineering/source-engineering-specifications/blob/main/cots/README.md
 */

export type URI = string;
export type ISO8601 = string;
export type SHA256 = string;
export type CalibratedScore = number;

export type CotsVersion = `${number}.${number}.${number}`;

export interface Cots {
  cots_version: CotsVersion;
  cots_id: URI;
  produced_at: ISO8601;
  produced_by: ProducedBy;
  inputs: Inputs;
  context: Context;
  decisions: DecisionRecord[];
  evidence: Evidence;
  validation: Validation;
}

export interface ProducedBy {
  system_name: string;
  system_version: string;
}

export interface Inputs {
  source_artifacts: SourceArtifact[];
}

export interface SourceArtifact {
  id: URI;
  origin: Origin;
  version: Version;
  authority: Authority;
  temporal_validity: TemporalValidity;
  content_reference?: ContentReference;
}

export interface Origin {
  system_name: string;
  system_version: string;
  configuration_hash: string;
}

export interface Version {
  content_hash: SHA256;
  issued_at: ISO8601;
}

export interface Authority {
  asserted_by: string;
  trust_score: CalibratedScore;
}

export interface TemporalValidity {
  valid_from: ISO8601;
  valid_until: ISO8601 | null;
}

export interface ContentReference {
  uri: string;
  media_type: string;
}

export interface Context {
  model: Model;
  parameters: Parameters;
  constraints: Constraint[];
}

export interface Model {
  model_name: string;
  model_version: string;
}

export interface Parameters {
  temperature: number;
  top_p: number;
  prompt_cache_id: string | null;
  tool_budget: number;
  retrieval_depth: number;
  additional?: Record<string, string | number | boolean>;
}

export interface Constraint {
  id: URI;
  type: string;
  scope: string;
  value: string;
}

export type ValidationStatusValue =
  | "pending"
  | "validated"
  | "contested"
  | "appealed"
  | "superseded";

export type ClaimType = "factual" | "normative" | "predictive" | "evaluative";

export type Polarity = "supports" | "contradicts" | "contextualises";

export type Action =
  | "created"
  | "appealed"
  | "rerun"
  | "corrected"
  | "escalated"
  | "superseded";

export interface DecisionRecord {
  id: URI;
  decision_text: string;
  basis_id: URI;
  evidence_chain_ref: URI;
  validation_status: ValidationStatus;
  responsible_authority: ResponsibleAuthority;
  audit_history: AuditEntry[];
  created_at: ISO8601;
  /** Layer 2 Validation record (COTS schema v1.1.0, RFC-0001). Optional. */
  validation?: Layer2Validation;
}

export type FlagType =
  | "drift-detected"
  | "segment-signal-divergence"
  | "parameter-set-out-of-range"
  | "temporal-validity-expired";

export type DecisionOnValidation = "passed" | "flagged" | "escalated";

export interface Layer2ValidationFlag {
  flag_type: FlagType;
  message: string;
  detected_at: ISO8601;
}

export interface Layer2Validation {
  flags: Layer2ValidationFlag[];
  decision_on_validation: DecisionOnValidation;
  validated_at: ISO8601;
  validated_by: string;
}

export interface ValidationStatus {
  status: ValidationStatusValue;
  last_changed_at: ISO8601;
  last_changed_by: string;
}

export interface ResponsibleAuthority {
  authority_id: string;
  authority_type: "human" | "organisational" | "automated";
}

export interface AuditEntry {
  id: URI;
  action: Action;
  performed_by: string;
  performed_at: ISO8601;
  notes: string;
}

export interface Evidence {
  evidence_chain: EvidenceChainEntry[];
}

export interface EvidenceChainEntry {
  decision_id: URI;
  supporting_evidence: EvidenceItem[];
  contradicting_evidence: EvidenceItem[];
  claims: Claim[];
}

export interface Claim {
  id: URI;
  decision_record_id: URI;
  claim_text: string;
  claim_type: ClaimType;
  supporting_evidence: URI[];
  contradicting_evidence: URI[];
}

export interface EvidenceItem {
  id: URI;
  claim_id: URI;
  source_id: URI;
  transformation: Transformation;
  uncertainty: Uncertainty;
  polarity: Polarity;
}

export interface Transformation {
  operation: string;
  inputs: string[];
  output: string;
  recorded_at: ISO8601;
}

export interface Uncertainty {
  calibrated_score: CalibratedScore;
  basis: string;
}

export interface Validation {
  feedback_surfaces: FeedbackSurface[];
}

export type FeedbackType = "appeal" | "rerun" | "correction";

export interface FeedbackSurface {
  id: URI;
  type: FeedbackType;
  target: URI;
  endpoint: string;
  description: string;
}
