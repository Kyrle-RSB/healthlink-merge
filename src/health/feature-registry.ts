// ============================================================
// Feature Registry — single source of truth for all features
// ============================================================
// Every feature in the project is registered here with its
// check type and target. The health checker iterates this list.
// ============================================================

export type FeatureCategory =
  | "api_core"
  | "api_carepoint"
  | "api_ai"
  | "api_assistant"
  | "api_integrations"
  | "api_meetings"
  | "api_demo"
  | "engine"
  | "database"
  | "frontend"
  | "auth"
  | "safety"
  | "storage";

export type CheckType = "route" | "api_post" | "db_table" | "db_query" | "function" | "frontend_asset";

export type HealthStatus = "green" | "yellow" | "red" | "grey";

export interface FeatureEntry {
  key: string;
  name: string;
  category: FeatureCategory;
  description: string;
  checkType: CheckType;
  checkTarget: string;
  expectedStatus?: number;
  postBody?: Record<string, unknown>;
  relatedTables?: string[];
}

export interface CheckResult {
  featureKey: string;
  status: HealthStatus;
  message: string;
  durationMs: number;
  checkedAt: string;
  details?: Record<string, unknown>;
}

export const FEATURE_REGISTRY: FeatureEntry[] = [
  // ============ API CORE ============
  {
    key: "api_health",
    name: "Health Endpoint",
    category: "api_core",
    description: "GET /api/health — DB connectivity check",
    checkType: "route",
    checkTarget: "/api/health",
  },
  {
    key: "api_auth_login",
    name: "Auth Login",
    category: "auth",
    description: "POST /api/auth/login — user authentication",
    checkType: "api_post",
    checkTarget: "/api/auth/login",
    postBody: { email: "test@example.com", password: "test" },
    expectedStatus: 401,
  },
  {
    key: "api_auth_register",
    name: "Auth Register",
    category: "auth",
    description: "POST /api/auth/register — user registration endpoint exists",
    checkType: "api_post",
    checkTarget: "/api/auth/register",
    postBody: { email: "", password: "" },
    expectedStatus: 400,
  },
  {
    key: "api_records_list",
    name: "Records List",
    category: "api_core",
    description: "GET /api/records — list records with pagination",
    checkType: "route",
    checkTarget: "/api/records",
  },
  {
    key: "api_upload",
    name: "File Upload Endpoint",
    category: "api_core",
    description: "POST /api/upload — R2 file upload",
    checkType: "api_post",
    checkTarget: "/api/upload",
    postBody: {},
    expectedStatus: 400,
  },
  {
    key: "api_uploads_list",
    name: "Uploads List",
    category: "api_core",
    description: "GET /api/uploads — list R2 uploads",
    checkType: "route",
    checkTarget: "/api/uploads",
  },

  // ============ CAREPOINT API ============
  {
    key: "api_chat",
    name: "CarePoint Chat",
    category: "api_carepoint",
    description: "POST /api/chat — main routing endpoint (symptom → destination)",
    checkType: "api_post",
    checkTarget: "/api/chat",
    postBody: { message: "health check test" },
    relatedTables: ["routing_sessions", "facilities", "problems"],
  },
  {
    key: "api_reroute",
    name: "Reroute Handler",
    category: "api_carepoint",
    description: "POST /api/reroute — accept/decline reroute offer",
    checkType: "api_post",
    checkTarget: "/api/reroute",
    postBody: { session_id: "nonexistent" },
    expectedStatus: 404,
  },
  {
    key: "api_reroute_check",
    name: "Reroute Check Polling",
    category: "api_carepoint",
    description: "GET /api/reroute/check/:sessionId — poll for reroute availability",
    checkType: "route",
    checkTarget: "/api/reroute/check/test-session",
  },
  {
    key: "api_facilities_list",
    name: "Facilities List",
    category: "api_carepoint",
    description: "GET /api/facilities — list all 65 facilities",
    checkType: "route",
    checkTarget: "/api/facilities",
    relatedTables: ["facilities"],
  },
  {
    key: "api_facility_detail",
    name: "Facility Detail",
    category: "api_carepoint",
    description: "GET /api/facilities/:id — single facility with details",
    checkType: "route",
    checkTarget: "/api/facilities/FAC-001",
    relatedTables: ["facilities"],
  },
  {
    key: "api_sessions_list",
    name: "Sessions List",
    category: "api_carepoint",
    description: "GET /api/sessions — recent routing sessions",
    checkType: "route",
    checkTarget: "/api/sessions",
    relatedTables: ["routing_sessions"],
  },
  {
    key: "api_system_snapshot",
    name: "System Snapshot",
    category: "api_carepoint",
    description: "GET /api/system/snapshot — full system state + metrics",
    checkType: "route",
    checkTarget: "/api/system/snapshot",
    relatedTables: ["facilities", "system_state", "routing_sessions"],
  },
  {
    key: "api_patients_list",
    name: "Patients List",
    category: "api_carepoint",
    description: "GET /api/patients — list all synthetic patients",
    checkType: "route",
    checkTarget: "/api/patients",
    relatedTables: ["patients"],
  },
  {
    key: "api_patient_detail",
    name: "Patient Detail",
    category: "api_carepoint",
    description: "GET /api/patients/:id — patient with conditions, meds, encounters",
    checkType: "route",
    checkTarget: "/api/patients/SYN-PAT-001",
    relatedTables: ["patients", "conditions", "medications", "encounters", "observations"],
  },
  {
    key: "api_problems_list",
    name: "Problems List",
    category: "api_carepoint",
    description: "GET /api/problems — 35 medical conditions with CTAS levels",
    checkType: "route",
    checkTarget: "/api/problems",
    relatedTables: ["problems"],
  },
  {
    key: "api_encounters_list",
    name: "Encounters List",
    category: "api_carepoint",
    description: "GET /api/encounters — all patient encounters",
    checkType: "route",
    checkTarget: "/api/encounters",
    relatedTables: ["encounters"],
  },
  {
    key: "api_staff_list",
    name: "Staff List",
    category: "api_carepoint",
    description: "GET /api/staff — all 22 staff members",
    checkType: "route",
    checkTarget: "/api/staff",
    relatedTables: ["staff"],
  },
  {
    key: "api_analytics",
    name: "Routing Analytics",
    category: "api_carepoint",
    description: "GET /api/analytics — ER diversion stats, routing metrics",
    checkType: "route",
    checkTarget: "/api/analytics",
    relatedTables: ["routing_sessions"],
  },

  // ============ AI FEATURES ============
  {
    key: "api_ai_transcribe",
    name: "Audio Transcription",
    category: "api_ai",
    description: "POST /api/ai/transcribe — Deepgram audio transcription (requires DEEPGRAM_API_KEY)",
    checkType: "api_post",
    checkTarget: "/api/ai/transcribe",
    postBody: {},
    expectedStatus: 501, // 501 when Deepgram key not configured
  },
  {
    key: "api_ai_reading_level",
    name: "Reading Level Generator",
    category: "api_ai",
    description: "POST /api/ai/reading-level — multi-level content generation (requires OPENAI_API_KEY)",
    checkType: "api_post",
    checkTarget: "/api/ai/reading-level",
    postBody: {},
    expectedStatus: 501,
  },
  {
    key: "api_ai_confidence",
    name: "Confidence Scorer",
    category: "api_ai",
    description: "POST /api/ai/confidence — AI output accuracy scoring (requires OPENAI_API_KEY)",
    checkType: "api_post",
    checkTarget: "/api/ai/confidence",
    postBody: {},
    expectedStatus: 501,
  },
  {
    key: "api_ai_embed",
    name: "Vector Embedding",
    category: "api_ai",
    description: "POST /api/ai/embed — text to Pinecone vector (requires PINECONE_API_KEY)",
    checkType: "api_post",
    checkTarget: "/api/ai/embed",
    postBody: {},
    expectedStatus: 501, // 501 when Pinecone not configured
  },
  {
    key: "api_ai_search",
    name: "Vector Search",
    category: "api_ai",
    description: "POST /api/ai/search — semantic search via Pinecone (requires PINECONE_API_KEY)",
    checkType: "api_post",
    checkTarget: "/api/ai/search",
    postBody: {},
    expectedStatus: 501, // 501 when Pinecone not configured
  },
  {
    key: "api_ai_vector_stats",
    name: "Vector Index Stats",
    category: "api_ai",
    description: "GET /api/ai/vectors/stats — Pinecone index statistics (requires PINECONE_API_KEY)",
    checkType: "route",
    checkTarget: "/api/ai/vectors/stats",
    expectedStatus: 501, // 501 when Pinecone not configured
  },

  // ============ AI ASSISTANT ============
  {
    key: "api_assistant_chat",
    name: "AI Assistant (RAG)",
    category: "api_assistant",
    description: "POST /api/assistant/chat — two-stage RAG assistant",
    checkType: "api_post",
    checkTarget: "/api/assistant/chat",
    postBody: { message: "health check" },
  },

  // ============ INTEGRATIONS ============
  {
    key: "api_integrations_list",
    name: "Integrations List",
    category: "api_integrations",
    description: "GET /api/integrations — list all provider configs",
    checkType: "route",
    checkTarget: "/api/integrations",
    relatedTables: ["integration_configs"],
  },

  // ============ MEETINGS ============
  {
    key: "api_meetings_list",
    name: "Meetings List",
    category: "api_meetings",
    description: "GET /api/meetings — list meetings",
    checkType: "route",
    checkTarget: "/api/meetings",
    relatedTables: ["meetings"],
  },

  // ============ DEMO ============
  {
    key: "api_demo_simulate",
    name: "Demo Simulator",
    category: "api_demo",
    description: "POST /api/demo/simulate — facility state simulation for demos",
    checkType: "api_post",
    checkTarget: "/api/demo/simulate",
    postBody: { step: "tick" },
  },

  // ============ DATABASE TABLES ============
  {
    key: "db_users",
    name: "Users Table",
    category: "database",
    description: "Users table with auth data",
    checkType: "db_table",
    checkTarget: "users",
  },
  {
    key: "db_records",
    name: "Records Table",
    category: "database",
    description: "Generic records with FTS5 index",
    checkType: "db_table",
    checkTarget: "records",
  },
  {
    key: "db_patients",
    name: "Patients Table",
    category: "database",
    description: "6 synthetic patients with barriers and demographics",
    checkType: "db_table",
    checkTarget: "patients",
  },
  {
    key: "db_encounters",
    name: "Encounters Table",
    category: "database",
    description: "Patient visit history with types and providers",
    checkType: "db_table",
    checkTarget: "encounters",
  },
  {
    key: "db_conditions",
    name: "Conditions Table",
    category: "database",
    description: "Patient conditions with ICD-10 codes",
    checkType: "db_table",
    checkTarget: "conditions",
  },
  {
    key: "db_medications",
    name: "Medications Table",
    category: "database",
    description: "Patient medications with dosage and frequency",
    checkType: "db_table",
    checkTarget: "medications",
  },
  {
    key: "db_observations",
    name: "Observations Table",
    category: "database",
    description: "Patient vitals and lab results",
    checkType: "db_table",
    checkTarget: "observations",
  },
  {
    key: "db_generated_notes",
    name: "Generated Notes Table",
    category: "database",
    description: "AI-generated clinical notes and patient summaries",
    checkType: "db_table",
    checkTarget: "generated_notes",
  },
  {
    key: "db_facilities",
    name: "Facilities Table",
    category: "database",
    description: "65 Victoria-area healthcare facilities with lat/lon",
    checkType: "db_table",
    checkTarget: "facilities",
  },
  {
    key: "db_staff",
    name: "Staff Table",
    category: "database",
    description: "22 healthcare staff with skills and shifts",
    checkType: "db_table",
    checkTarget: "staff",
  },
  {
    key: "db_problems",
    name: "Problems Table",
    category: "database",
    description: "35 medical conditions with CTAS, ICD-10, routing",
    checkType: "db_table",
    checkTarget: "problems",
  },
  {
    key: "db_problems_fts",
    name: "Problems FTS Index",
    category: "database",
    description: "Full-text search on problems for symptom matching",
    checkType: "db_table",
    checkTarget: "problems_fts",
  },
  {
    key: "db_routing_sessions",
    name: "Routing Sessions Table",
    category: "database",
    description: "CarePoint routing session history",
    checkType: "db_table",
    checkTarget: "routing_sessions",
  },
  {
    key: "db_system_state",
    name: "System State Table",
    category: "database",
    description: "Real-time facility metrics (load, wait times)",
    checkType: "db_table",
    checkTarget: "system_state",
  },
  {
    key: "db_integration_configs",
    name: "Integration Configs Table",
    category: "database",
    description: "Provider integration settings (OpenAI, Pinecone, etc.)",
    checkType: "db_table",
    checkTarget: "integration_configs",
  },
  {
    key: "db_meetings",
    name: "Meetings Table",
    category: "database",
    description: "Meeting records for care coordination",
    checkType: "db_table",
    checkTarget: "meetings",
  },
  {
    key: "db_records_fts",
    name: "Records FTS Index",
    category: "database",
    description: "Full-text search on records",
    checkType: "db_table",
    checkTarget: "records_fts",
  },

  // ============ FRONTEND ASSETS ============
  {
    key: "frontend_carepoint",
    name: "CarePoint UI",
    category: "frontend",
    description: "Split-screen routing interface at /carepoint.html",
    checkType: "frontend_asset",
    checkTarget: "/carepoint.html",
  },
  {
    key: "frontend_admin",
    name: "Admin Dashboard",
    category: "frontend",
    description: "Admin panel at /admin.html with 10+ pages",
    checkType: "frontend_asset",
    checkTarget: "/admin.html",
  },
  {
    key: "frontend_home",
    name: "Home / Landing Page",
    category: "frontend",
    description: "CarePoint landing page at /index.html",
    checkType: "frontend_asset",
    checkTarget: "/index.html",
  },
  {
    key: "frontend_health",
    name: "Health Dashboard",
    category: "frontend",
    description: "Feature health checker at /health.html",
    checkType: "frontend_asset",
    checkTarget: "/health.html",
  },

  // ============ ENGINES (functional checks via dependent routes) ============
  {
    key: "engine_context",
    name: "Context Engine",
    category: "engine",
    description: "Patient context assembly (profile + FTS + facility state)",
    checkType: "route",
    checkTarget: "/api/patients/SYN-PAT-002",
    relatedTables: ["patients", "conditions", "medications", "encounters"],
  },
  {
    key: "engine_routing",
    name: "Routing Engine",
    category: "engine",
    description: "Hard rules + AI soft routing decision engine",
    checkType: "api_post",
    checkTarget: "/api/chat",
    postBody: { message: "chest pain", patient_id: "SYN-PAT-002" },
    relatedTables: ["facilities", "problems", "routing_sessions"],
  },
  {
    key: "engine_rerouter",
    name: "Dynamic Rerouter",
    category: "engine",
    description: "Proactive reroute detection for active sessions",
    checkType: "route",
    checkTarget: "/api/reroute/check/test-health-check",
  },
  {
    key: "engine_simulator",
    name: "Demo Simulator",
    category: "engine",
    description: "Facility state simulation for demo scenarios",
    checkType: "api_post",
    checkTarget: "/api/demo/simulate",
    postBody: { step: "tick" },
  },

  // ============ SAFETY ============
  {
    key: "safety_phi_detection",
    name: "PHI Detection",
    category: "safety",
    description: "Pattern matching for SSN, phone, email, MRN, DOB, IP addresses",
    checkType: "function",
    checkTarget: "containsPHIPatterns",
  },
  {
    key: "safety_content_classification",
    name: "Content Classification",
    category: "safety",
    description: "Content safety levels: safe, caution, blocked",
    checkType: "function",
    checkTarget: "classifyContent",
  },
  {
    key: "safety_mock_validation",
    name: "Mock Data Validation",
    category: "safety",
    description: "Ensures all data contains MOCK/SYNTHETIC markers",
    checkType: "function",
    checkTarget: "assertMockData",
  },

  // ============ STORAGE ============
  {
    key: "storage_d1",
    name: "D1 Database",
    category: "storage",
    description: "Cloudflare D1 SQLite database connectivity",
    checkType: "route",
    checkTarget: "/api/health",
  },
  {
    key: "storage_kv",
    name: "KV Namespace",
    category: "storage",
    description: "Cloudflare KV for tokens and session state",
    checkType: "function",
    checkTarget: "kv_available",
  },
  {
    key: "storage_r2",
    name: "R2 Bucket",
    category: "storage",
    description: "Cloudflare R2 for file storage",
    checkType: "route",
    checkTarget: "/api/uploads",
  },
];

/** Get features by category */
export function getFeaturesByCategory(category: FeatureCategory): FeatureEntry[] {
  return FEATURE_REGISTRY.filter((f) => f.category === category);
}

/** Get all unique categories */
export function getCategories(): FeatureCategory[] {
  return [...new Set(FEATURE_REGISTRY.map((f) => f.category))];
}
