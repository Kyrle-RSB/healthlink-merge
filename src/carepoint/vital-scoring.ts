// ============================================================
// Vital-Based Triage Scoring — ported from SILA's triageLogic.js
// ============================================================
// Calculates a numeric triage score from patient vitals, symptoms,
// risk factors, and age. Used to augment the routing engine's
// text-based analysis with objective clinical data.
// ============================================================

import type { ObservationRow, PatientRow, ConditionRow } from "../types";

// ---- Types ----

export interface VitalScoreResult {
  score: number;
  level: 1 | 2 | 3 | 4 | 5;
  breakdown: {
    vitals: number;
    symptoms: number;
    riskFactors: number;
    age: number;
  };
  flags: string[];
}

export interface Coordinates {
  lat: number;
  lon: number;
}

// ---- Vital Thresholds ----

interface VitalThreshold {
  code: string;
  label: string;
  ranges: { min?: number; max?: number; points: number }[];
}

const VITAL_THRESHOLDS: VitalThreshold[] = [
  {
    code: "heart_rate",
    label: "Heart Rate",
    ranges: [
      { max: 40, points: 20 },
      { min: 120, points: 20 },
      { max: 60, points: 10 },
      { min: 100, points: 10 },
    ],
  },
  {
    code: "bp_systolic",
    label: "Blood Pressure (systolic)",
    ranges: [
      { max: 80, points: 15 },
      { min: 180, points: 15 },
      { max: 90, points: 8 },
      { min: 160, points: 8 },
    ],
  },
  {
    code: "temperature",
    label: "Temperature",
    ranges: [
      { max: 95, points: 12 },
      { min: 103, points: 12 },
      { max: 96, points: 6 },
      { min: 101, points: 6 },
    ],
  },
  {
    code: "respiratory_rate",
    label: "Respiratory Rate",
    ranges: [
      { max: 10, points: 18 },
      { min: 30, points: 18 },
      { max: 12, points: 10 },
      { min: 24, points: 10 },
    ],
  },
  {
    code: "oxygen_saturation",
    label: "O2 Saturation",
    ranges: [
      { max: 90, points: 25 },
      { max: 94, points: 15 },
    ],
  },
];

// ---- Symptom Keywords ----

const CRITICAL_SYMPTOMS = [
  "chest pain",
  "difficulty breathing",
  "unconscious",
  "severe bleeding",
];

const SERIOUS_SYMPTOMS = [
  "confusion",
  "severe headache",
  "vision changes",
  "stroke symptoms",
  "stroke",
  "face drooping",
  "arm weakness",
  "speech slur",
];

const MODERATE_SYMPTOMS = [
  "abdominal pain",
  "high fever",
  "dizziness",
];

// ---- Risk Factor Conditions ----

const RISK_FACTOR_KEYWORDS = [
  "heart disease",
  "hypertension",
  "diabetes",
  "stroke",
  "asthma",
  "copd",
];

const RISK_POINTS_EACH = 5;

// ---- Score Thresholds -> Triage Levels ----

function scoreToLevel(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 90) return 1;
  if (score >= 70) return 2;
  if (score >= 50) return 3;
  if (score >= 25) return 4;
  return 5;
}

// ---- Core Scoring Functions ----

/**
 * Extract a numeric value from an ObservationRow by code prefix.
 * Observations may use LOINC codes or plain labels — we match loosely.
 */
function findObservationValue(
  observations: ObservationRow[],
  code: string
): number | null {
  const codeLower = code.toLowerCase();
  const obs = observations.find((o) => {
    const c = o.code.toLowerCase();
    const d = (o.description || "").toLowerCase();
    return c.includes(codeLower) || d.includes(codeLower);
  });
  if (!obs || obs.value == null) return null;
  const num = parseFloat(obs.value);
  return isNaN(num) ? null : num;
}

/**
 * Score vitals from observation data.
 * For each vital, the highest-matching threshold wins (ranges are ordered
 * from most extreme to least extreme, so first match = highest points).
 */
function scoreVitals(observations: ObservationRow[]): { points: number; flags: string[] } {
  let points = 0;
  const flags: string[] = [];

  for (const vital of VITAL_THRESHOLDS) {
    const value = findObservationValue(observations, vital.code);
    if (value == null) continue;

    for (const range of vital.ranges) {
      const belowMax = range.max != null && range.min == null && value < range.max;
      const aboveMin = range.min != null && range.max == null && value > range.min;

      if (belowMax || aboveMin) {
        points += range.points;
        flags.push(`${vital.label}: ${value} (+${range.points})`);
        break; // first (most severe) match wins
      }
    }
  }

  return { points, flags };
}

/**
 * Score symptom keywords found in complaint text.
 */
function scoreSymptoms(complaint: string): { points: number; flags: string[] } {
  const lower = complaint.toLowerCase();
  let points = 0;
  const flags: string[] = [];

  for (const kw of CRITICAL_SYMPTOMS) {
    if (lower.includes(kw)) {
      points += 20;
      flags.push(`Critical symptom: ${kw} (+20)`);
    }
  }
  for (const kw of SERIOUS_SYMPTOMS) {
    if (lower.includes(kw)) {
      points += 15;
      flags.push(`Serious symptom: ${kw} (+15)`);
    }
  }
  for (const kw of MODERATE_SYMPTOMS) {
    if (lower.includes(kw)) {
      points += 8;
      flags.push(`Moderate symptom: ${kw} (+8)`);
    }
  }

  return { points, flags };
}

/**
 * Score pre-existing risk factors from the patient's condition list.
 */
function scoreRiskFactors(conditions: ConditionRow[]): { points: number; flags: string[] } {
  let points = 0;
  const flags: string[] = [];

  const condText = conditions
    .filter((c) => c.status === "active")
    .map((c) => c.description.toLowerCase())
    .join(" ");

  for (const rf of RISK_FACTOR_KEYWORDS) {
    if (condText.includes(rf)) {
      points += RISK_POINTS_EACH;
      flags.push(`Risk factor: ${rf} (+${RISK_POINTS_EACH})`);
    }
  }

  return { points, flags };
}

/**
 * Age-based scoring. +5 if patient is over 65.
 */
function scoreAge(patient: PatientRow | null): { points: number; flags: string[] } {
  if (!patient) return { points: 0, flags: [] };

  const age = Math.floor(
    (Date.now() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  if (age > 65) {
    return { points: 5, flags: [`Age ${age} > 65 (+5)`] };
  }
  return { points: 0, flags: [] };
}

// ---- Public API ----

/**
 * Calculate full triage score from all available patient data.
 */
export function calculateVitalScore(
  complaint: string,
  observations: ObservationRow[],
  conditions: ConditionRow[],
  patient: PatientRow | null
): VitalScoreResult {
  const vitals = scoreVitals(observations);
  const symptoms = scoreSymptoms(complaint);
  const riskFactors = scoreRiskFactors(conditions);
  const age = scoreAge(patient);

  const totalScore = vitals.points + symptoms.points + riskFactors.points + age.points;
  const allFlags = [...vitals.flags, ...symptoms.flags, ...riskFactors.flags, ...age.flags];

  return {
    score: totalScore,
    level: scoreToLevel(totalScore),
    breakdown: {
      vitals: vitals.points,
      symptoms: symptoms.points,
      riskFactors: riskFactors.points,
      age: age.points,
    },
    flags: allFlags,
  };
}

// ---- Haversine Distance ----

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two lat/lon points in kilometres.
 */
export function haversineDistance(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
