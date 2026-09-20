import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type PatientRow = {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  chief_complaint: string;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "STABLE";
  status: "QUEUED" | "REVIEWED";
  created_at: string;
};

export type LabReportRow = {
  id: string;
  patient_id: string;
  filename: string;
  patient_name: string;
  risk_level: PatientRow["risk_level"];
  overall_summary: string;
  biomarkers: string;
  soap_note: string;
  patient_explanation: string;
  analysis_mode: string;
  created_at: string;
};

export type ReferralRow = {
  id: string;
  patient_id: string;
  referral_text: string;
  analysis_mode: string;
  created_at: string;
};

const databasePath =
  process.env.SQLITE_DB_PATH ??
  path.resolve(process.cwd(), "artifacts/api-server/data/pulseai.sqlite");

mkdirSync(path.dirname(databasePath), { recursive: true });

export const sqlite = new DatabaseSync(databasePath);

sqlite.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    chief_complaint TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'STABLE')),
    status TEXT NOT NULL CHECK (status IN ('QUEUED', 'REVIEWED')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lab_reports (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    filename TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('CRITICAL', 'HIGH', 'MEDIUM', 'STABLE')),
    overall_summary TEXT NOT NULL,
    biomarkers TEXT NOT NULL,
    soap_note TEXT NOT NULL,
    patient_explanation TEXT NOT NULL,
    analysis_mode TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    referral_text TEXT NOT NULL,
    analysis_mode TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

const seedPatients: PatientRow[] = [
  {
    id: "john-doe",
    full_name: "John Doe",
    age: 45,
    gender: "Male",
    chief_complaint: "Severe weakness and palpitations",
    risk_level: "CRITICAL",
    status: "QUEUED",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "jane-smith",
    full_name: "Jane Smith",
    age: 58,
    gender: "Female",
    chief_complaint: "Chest discomfort",
    risk_level: "HIGH",
    status: "QUEUED",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "alex-johnson",
    full_name: "Alex Johnson",
    age: 31,
    gender: "Male",
    chief_complaint: "Routine health check",
    risk_level: "STABLE",
    status: "QUEUED",
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

const seedStatement = sqlite.prepare(`
  INSERT OR IGNORE INTO patients
    (id, full_name, age, gender, chief_complaint, risk_level, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const patient of seedPatients) {
  seedStatement.run(
    patient.id,
    patient.full_name,
    patient.age,
    patient.gender,
    patient.chief_complaint,
    patient.risk_level,
    patient.status,
    patient.created_at,
  );
}

export function listPatients(): PatientRow[] {
  return sqlite
    .prepare("SELECT * FROM patients ORDER BY CASE risk_level WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, created_at")
    .all() as unknown as PatientRow[];
}

export function getPatient(id: string): PatientRow | undefined {
  return sqlite
    .prepare("SELECT * FROM patients WHERE id = ?")
    .get(id) as unknown as PatientRow | undefined;
}

export function createPatient(patient: Omit<PatientRow, "created_at">): PatientRow {
  const createdAt = new Date().toISOString();
  sqlite
    .prepare(`
      INSERT INTO patients
        (id, full_name, age, gender, chief_complaint, risk_level, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      patient.id,
      patient.full_name,
      patient.age,
      patient.gender,
      patient.chief_complaint,
      patient.risk_level,
      patient.status,
      createdAt,
    );
  return { ...patient, created_at: createdAt };
}

export function saveLabReport(
  report: Omit<LabReportRow, "created_at">,
): LabReportRow {
  const createdAt = new Date().toISOString();
  sqlite
    .prepare(`
      INSERT INTO lab_reports
        (id, patient_id, filename, patient_name, risk_level, overall_summary,
         biomarkers, soap_note, patient_explanation, analysis_mode, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      report.id,
      report.patient_id,
      report.filename,
      report.patient_name,
      report.risk_level,
      report.overall_summary,
      report.biomarkers,
      report.soap_note,
      report.patient_explanation,
      report.analysis_mode,
      createdAt,
    );
  return { ...report, created_at: createdAt };
}

export function getLabReport(id: string): LabReportRow | undefined {
  return sqlite
    .prepare("SELECT * FROM lab_reports WHERE id = ?")
    .get(id) as unknown as LabReportRow | undefined;
}

export function saveReferral(
  referral: Omit<ReferralRow, "created_at">,
): ReferralRow {
  const createdAt = new Date().toISOString();
  sqlite
    .prepare(`
      INSERT INTO referrals
        (id, patient_id, referral_text, analysis_mode, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(
      referral.id,
      referral.patient_id,
      referral.referral_text,
      referral.analysis_mode,
      createdAt,
    );
  return { ...referral, created_at: createdAt };
}