// ============================================================
// Shared Types — used across the entire boilerplate
// ============================================================

/** Cloudflare Worker environment bindings */
export interface Env {
  // Cloudflare bindings
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;

  // Environment variables
  OPENAI_API_KEY: string;
  AUTH_SECRET: string;
  DEMO_MODE: string;
  ENVIRONMENT: string;
  APP_NAME: string;

  // Backend selection: "d1" (default) or "supabase"
  BACKEND: string;

  // Supabase (optional — only needed if BACKEND=supabase)
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Deepgram (optional — for voice transcription)
  DEEPGRAM_API_KEY: string;

  // Pinecone (optional — for vector/semantic search)
  PINECONE_API_KEY: string;
  PINECONE_INDEX_HOST: string;
}

/** Standard API response shape — every endpoint returns this */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}

/** Authenticated user context attached to requests */
export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/** Extended request with parsed auth */
export interface AuthedRequest {
  user: AuthUser | null;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
}

/** Route handler signature */
export type RouteHandler = (
  request: Request,
  env: Env,
  ctx: AuthedRequest
) => Promise<Response> | Response;

/** Route definition */
export interface Route {
  method: string;
  pattern: string;
  handler: RouteHandler;
  requiresAuth?: boolean;
}

// ============================================================
// CarePoint Types
// ============================================================

export interface FacilityRow {
  id: string;
  name: string;
  type: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  hours: string;
  services: string; // JSON array
  capacity_total: number | null;
  capacity_current: number | null;
  wait_minutes: number;
  accepting_patients: number;
  departments: string | null; // JSON array
  created_at: string;
  updated_at: string;
}

export interface StaffRow {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  facility_id: string | null;
  is_client_facing: number;
  skills: string | null; // JSON array
  shift_pattern: string | null;
  on_duty: number;
  created_at: string;
}

export interface ProblemRow {
  id: string;
  title: string;
  icd10_code: string;
  type: string;
  severity: number;
  ctas_level: number;
  recommended_destination: string;
  symptoms: string; // JSON array
  red_flags: string | null; // JSON array
  related_conditions: string | null; // JSON array
  typical_wait_tolerance: string | null;
  created_at: string;
}

export interface RoutingSessionRow {
  id: string;
  patient_id: string | null;
  status: string;
  initial_complaint: string;
  sentiment: string | null;
  urgency_score: number | null;
  confidence_score: number | null;
  recommended_destination: string | null;
  recommended_facility_id: string | null;
  actual_destination: string | null;
  rerouted_from: string | null;
  reroute_reason: string | null;
  conversation_log: string | null; // JSON array
  context_snapshot: string | null; // JSON object
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface SystemMetricRow {
  id: string;
  facility_id: string;
  metric_name: string;
  metric_value: number;
  recorded_at: string;
}

export interface PatientRow {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  language: string;
  phone: string | null;
  postal_code: string | null;
  has_family_doctor: number;
  has_insurance: number;
  barriers: string | null; // JSON array
  conditions_summary: string | null;
  created_at: string;
}

export interface ConditionRow {
  id: string;
  patient_id: string;
  encounter_id: string | null;
  code: string;
  description: string;
  onset_date: string | null;
  status: string;
}

export interface MedicationRow {
  id: string;
  patient_id: string;
  encounter_id: string | null;
  code: string;
  description: string;
  dosage: string | null;
  frequency: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

export interface EncounterRow {
  id: string;
  patient_id: string;
  encounter_date: string;
  encounter_type: string;
  reason: string | null;
  provider_name: string | null;
  facility_id: string | null;
  status: string;
  created_at: string;
}

export interface ObservationRow {
  id: string;
  patient_id: string;
  encounter_id: string | null;
  code: string;
  description: string;
  value: string | null;
  unit: string | null;
  observation_date: string | null;
}

export interface PatientContext {
  patient: PatientRow | null;
  conditions: ConditionRow[];
  medications: MedicationRow[];
  encounters: EncounterRow[];
  observations: ObservationRow[];
  barriers: string[];
  matchedProblems: ProblemRow[];
  systemState: FacilitySnapshot[];
}

export interface FacilitySnapshot {
  facility: FacilityRow;
  load_pct: number;
  wait_minutes: number;
}

export interface RoutingDecision {
  destination: string;
  facility: FacilityRow | null;
  confidence: number;
  urgency: number;
  reasoning: string;
  clinical_reasoning: string;
  alternatives: AlternativeRoute[];
  wait_estimate_minutes: number;
  reroute_eligible: boolean;
  sentiment: string;
}

export interface AlternativeRoute {
  destination: string;
  facility: FacilityRow;
  reasoning: string;
  wait_estimate_minutes: number;
}

export interface RerouteOffer {
  session_id: string;
  current_facility: FacilityRow;
  suggested_facility: FacilityRow;
  reason: string;
  new_wait_minutes: number;
  current_wait_minutes: number;
}

export interface ChatMessage {
  role: 'patient' | 'system' | 'carepoint';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
