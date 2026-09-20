import { z } from "zod";
import type { PatientRow } from "./sqlite";

export const DEMO_FALLBACK_LABEL = "DEMO FALLBACK — AI BACKEND NOT CONFIGURED";

const BiomarkerSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  normal_range: z.string().min(1),
  status: z.string().min(1),
});

const SoapNoteSchema = z.object({
  subjective: z.string().min(1),
  objective: z.string().min(1),
  assessment: z.string().min(1),
  plan: z.string().min(1),
});

const ClinicalAnalysisSchema = z.object({
  patient_name: z.string().min(1),
  risk_level: z.enum(["CRITICAL", "HIGH", "MEDIUM", "STABLE"]),
  summary: z.string().min(1),
  biomarkers: z.array(BiomarkerSchema),
  soap_note: SoapNoteSchema,
  patient_explanation: z.string().min(1),
});

type ClinicalAnalysis = z.infer<typeof ClinicalAnalysisSchema>;

type UploadedReport = {
  filename: string;
  contentType: string;
  data: Buffer;
};

function fallbackAnalysis(patient: PatientRow): ClinicalAnalysis {
  if (patient.id === "john-doe") {
    return {
      patient_name: "John Doe",
      risk_level: "CRITICAL",
      summary:
        "Severe hyperkalemia detected with potassium of 6.2 mEq/L. Immediate clinician review is required.",
      biomarkers: [
        {
          name: "Potassium",
          value: "6.2 mEq/L",
          normal_range: "3.5–5.0 mEq/L",
          status: "CRITICAL",
        },
      ],
      soap_note: {
        subjective:
          "Patient reports severe weakness and palpitations. Symptoms are recorded from the synthetic triage intake.",
        objective:
          "Laboratory report demo result shows potassium 6.2 mEq/L against a stated reference range of 3.5–5.0 mEq/L.",
        assessment:
          "Critical laboratory signal requiring prompt clinician review and correlation with the source report and patient presentation. This is not an autonomous diagnosis.",
        plan:
          "Review the original report, confirm the result according to local clinical protocol, assess the patient promptly, and document clinician-directed next steps.",
      },
      patient_explanation:
        "Your sample report shows potassium above the usual range. Higher potassium can affect how the heart beats, so a clinician should review this result promptly and explain the next steps.",
    };
  }

  return {
    patient_name: patient.full_name,
    risk_level: patient.risk_level,
    summary: `Demo analysis prepared for ${patient.full_name}. Clinician review is required before this information is used.`,
    biomarkers: [
      {
        name: "Available report data",
        value: "Not connected in demo fallback",
        normal_range: "Not available",
        status: "REVIEW",
      },
    ],
    soap_note: {
      subjective: `${patient.full_name}: ${patient.chief_complaint}.`,
      objective: "No report values were interpreted because the Gemini backend is not configured.",
      assessment: `${patient.risk_level} triage priority from the synthetic patient record. This is not a diagnosis.`,
      plan: "A clinician should review the source report and determine the appropriate next steps.",
    },
    patient_explanation:
      "This demonstration could not interpret the uploaded report. Please ask your clinician to review the original result and explain what it means for you.",
  };
}

function mimeTypeForFilename(filename: string, contentType: string): string {
  if (contentType !== "application/octet-stream") return contentType;
  const extension = filename.toLowerCase().split(".").pop();
  return (
    {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      csv: "text/csv",
    }[extension ?? ""] ?? "application/octet-stream"
  );
}

function parseModelJson(text: string): unknown {
  const trimmed = text.trim();
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(withoutFence);
}

async function callGemini(prompt: string, report?: UploadedReport): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (report) {
    parts.push({
      inlineData: {
        mimeType: mimeTypeForFilename(report.filename, report.contentType),
        data: report.data.toString("base64"),
      },
    });
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed with HTTP ${response.status}: ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

export async function analyzeReport(
  patient: PatientRow,
  report: UploadedReport,
): Promise<{ analysis: ClinicalAnalysis; analysisMode: string }> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      analysis: fallbackAnalysis(patient),
      analysisMode: DEMO_FALLBACK_LABEL,
    };
  }

  const prompt = `You are assisting a licensed clinician reviewing a laboratory report. Return only valid JSON matching this exact shape:
{
  "patient_name": "string",
  "risk_level": "CRITICAL | HIGH | MEDIUM | STABLE",
  "summary": "string",
  "biomarkers": [{ "name": "string", "value": "string", "normal_range": "string", "status": "string" }],
  "soap_note": { "subjective": "string", "objective": "string", "assessment": "string", "plan": "string" },
  "patient_explanation": "string"
}
Patient context: ${JSON.stringify({
    name: patient.full_name,
    age: patient.age,
    gender: patient.gender,
    chief_complaint: patient.chief_complaint,
  })}
Use cautious clinical language, do not claim certainty beyond the report, and state that clinician review is required.`;

  const text = await callGemini(prompt, report);
  const parsed = ClinicalAnalysisSchema.safeParse(parseModelJson(text));
  if (!parsed.success) {
    throw new Error(`Gemini returned malformed clinical JSON: ${parsed.error.message}`);
  }
  return { analysis: parsed.data, analysisMode: "GEMINI AI ANALYSIS" };
}

export async function generateReferral(
  patient: PatientRow,
): Promise<{ referralText: string; analysisMode: string }> {
  if (!process.env.GEMINI_API_KEY) {
    const urgency =
      patient.risk_level === "CRITICAL"
        ? "Prompt clinician review recommended based on the supplied triage signal."
        : patient.risk_level === "HIGH"
          ? "Priority clinician review recommended based on the supplied triage signal."
          : "Routine clinician review based on the supplied triage signal.";
    return {
      referralText: `AI-ASSISTED DRAFT — CLINICIAN REVIEW REQUIRED\n\nPatient information\nName: ${patient.full_name}\nAge: ${patient.age}\nGender: ${patient.gender}\n\nReason for referral\n${patient.chief_complaint}\n\nKey clinical findings\nRisk level: ${patient.risk_level}\nSource record status: ${patient.status}\n\nRisk assessment\n${patient.risk_level} priority signal from the synthetic triage record. This is not an autonomous medical decision.\n\nSuggested urgency\n${urgency}\n\nPlease review the original clinical information, edit this draft, and approve it before sharing.`,
      analysisMode: DEMO_FALLBACK_LABEL,
    };
  }

  const prompt = `Create a concise structured referral draft for clinician review. Return only JSON in the form {"referral_text":"string"}. Include patient information, reason for referral, key clinical findings, risk assessment, and suggested urgency. Clearly state "AI-ASSISTED DRAFT — CLINICIAN REVIEW REQUIRED" and do not present the output as an autonomous medical decision.
Patient: ${JSON.stringify(patient)}`;
  const text = await callGemini(prompt);
  const parsed = z.object({ referral_text: z.string().min(1) }).safeParse(parseModelJson(text));
  if (!parsed.success) {
    throw new Error(`Gemini returned malformed referral JSON: ${parsed.error.message}`);
  }
  return { referralText: parsed.data.referral_text, analysisMode: "GEMINI AI ANALYSIS" };
}