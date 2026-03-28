// ============================================================
// Mock Data Fixtures — synthetic healthcare data
// ============================================================
// ALL data here is completely fictional. No real patients,
// providers, or health information is represented.
// Use these fixtures for development, testing, and demos.
// ============================================================

export interface MockPatient {
  syntheticId: string;
  name: string;
  age: number;
  conditions: string[];
  medications: string[];
}

export interface MockVisit {
  syntheticId: string;
  patientId: string;
  type: string;
  summary: string;
  date: string;
}

/** Synthetic patient records — clearly marked as fake */
export const MOCK_PATIENTS: MockPatient[] = [
  {
    syntheticId: "SYN-1001",
    name: "Jane Doe (SYNTHETIC)",
    age: 45,
    conditions: ["Type 2 Diabetes", "Hypertension"],
    medications: ["Metformin 500mg BID", "Lisinopril 10mg daily"],
  },
  {
    syntheticId: "SYN-1002",
    name: "John Smith (SYNTHETIC)",
    age: 62,
    conditions: ["Hyperlipidemia", "Osteoarthritis"],
    medications: ["Atorvastatin 20mg daily", "Ibuprofen 400mg PRN"],
  },
  {
    syntheticId: "SYN-1003",
    name: "Maria Garcia (SYNTHETIC)",
    age: 34,
    conditions: ["Asthma", "Seasonal Allergies"],
    medications: ["Albuterol inhaler PRN", "Cetirizine 10mg daily"],
  },
  {
    syntheticId: "SYN-1004",
    name: "Robert Chen (SYNTHETIC)",
    age: 71,
    conditions: ["COPD", "Atrial Fibrillation"],
    medications: ["Tiotropium 18mcg daily", "Apixaban 5mg BID"],
  },
  {
    syntheticId: "SYN-1005",
    name: "Sarah Williams (SYNTHETIC)",
    age: 28,
    conditions: ["Depression", "Migraine"],
    medications: ["Sertraline 50mg daily", "Sumatriptan 50mg PRN"],
  },
];

/** Synthetic visit records */
export const MOCK_VISITS: MockVisit[] = [
  {
    syntheticId: "VISIT-001",
    patientId: "SYN-1001",
    type: "Annual Wellness",
    summary: "MOCK: Routine wellness visit. A1C at 6.8%, BP 132/84. Continuing current medication regimen.",
    date: "2024-11-15",
  },
  {
    syntheticId: "VISIT-002",
    patientId: "SYN-1002",
    type: "Follow-Up",
    summary: "MOCK: Lipid panel review. LDL decreased to 110 from 145. Statin therapy effective.",
    date: "2024-11-20",
  },
  {
    syntheticId: "VISIT-003",
    patientId: "SYN-1003",
    type: "Acute Visit",
    summary: "MOCK: Asthma exacerbation. Peak flow 75% of personal best. Added short course oral corticosteroids.",
    date: "2024-12-01",
  },
  {
    syntheticId: "VISIT-004",
    patientId: "SYN-1004",
    type: "Specialist Referral",
    summary: "MOCK: Pulmonology referral for COPD management. Spirometry shows moderate obstruction.",
    date: "2024-12-05",
  },
  {
    syntheticId: "VISIT-005",
    patientId: "SYN-1005",
    type: "Mental Health",
    summary: "MOCK: PHQ-9 improved from 12 to 7. Continuing sertraline. Adding CBT referral.",
    date: "2024-12-10",
  },
];

/** Get a random mock patient */
export function getRandomPatient(): MockPatient {
  return MOCK_PATIENTS[Math.floor(Math.random() * MOCK_PATIENTS.length)];
}

/** Get visits for a patient */
export function getVisitsForPatient(patientId: string): MockVisit[] {
  return MOCK_VISITS.filter((v) => v.patientId === patientId);
}
