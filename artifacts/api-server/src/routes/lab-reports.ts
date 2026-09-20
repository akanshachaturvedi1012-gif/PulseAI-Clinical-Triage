import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  AnalyzeLabReportResponse,
  GetLabReportParams,
  GetLabReportResponse,
} from "@workspace/api-zod";
import { analyzeReport } from "../lib/ai";
import { parseMultipartForm } from "../lib/multipart";
import { getLabReport, getPatient, saveLabReport } from "../lib/sqlite";

const router: IRouter = Router();
const allowedExtensions = new Set(["pdf", "doc", "docx", "txt", "csv"]);

function toLabReportResponse(row: ReturnType<typeof getLabReport>) {
  if (!row) return null;
  return AnalyzeLabReportResponse.parse({
    ...row,
    biomarkers: JSON.parse(row.biomarkers),
    soap_note: JSON.parse(row.soap_note),
  });
}

router.post("/lab-reports/analyze", async (req, res): Promise<void> => {
  let form;
  try {
    form = parseMultipartForm(req);
  } catch (error) {
    res.status(400).json({
      error: "Invalid multipart upload.",
      details: error instanceof Error ? error.message : "Unable to parse upload.",
    });
    return;
  }

  if (!form.file || !form.file.filename) {
    res.status(400).json({ error: "A lab report file is required." });
    return;
  }

  const extension = form.file.filename.toLowerCase().split(".").pop() ?? "";
  if (!allowedExtensions.has(extension)) {
    res.status(400).json({ error: "Unsupported report type. Use PDF, DOC, DOCX, TXT, or CSV." });
    return;
  }
  if (form.file.data.byteLength > 10 * 1024 * 1024) {
    res.status(400).json({ error: "The report exceeds the 10 MB upload limit." });
    return;
  }

  const patientId = form.fields.patient_id?.trim() || "john-doe";
  const patient = getPatient(patientId);
  if (!patient) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }

  try {
    const result = await analyzeReport(patient, {
      filename: form.file.filename,
      contentType: form.file.contentType,
      data: form.file.data,
    });
    const saved = saveLabReport({
      id: randomUUID(),
      patient_id: patient.id,
      filename: form.file.filename,
      patient_name: result.analysis.patient_name,
      risk_level: result.analysis.risk_level,
      overall_summary: result.analysis.summary,
      biomarkers: JSON.stringify(result.analysis.biomarkers),
      soap_note: JSON.stringify(result.analysis.soap_note),
      patient_explanation: result.analysis.patient_explanation,
      analysis_mode: result.analysisMode,
    });
    res.status(201).json(toLabReportResponse(saved));
  } catch (error) {
    req.log.error({ err: error, patientId }, "Lab report analysis failed");
    res.status(502).json({
      error: "AI analysis failed.",
      details: error instanceof Error ? error.message : "The analysis service returned an error.",
    });
  }
});

router.get("/lab-reports/:id", (req, res): void => {
  const params = GetLabReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid lab report id.", details: params.error.message });
    return;
  }

  try {
    const report = getLabReport(params.data.id);
    if (!report) {
      res.status(404).json({ error: "Lab report not found." });
      return;
    }
    res.json(toLabReportResponse(report));
  } catch (error) {
    req.log.error({ err: error }, "Failed to retrieve lab report");
    res.status(500).json({ error: "Database failure while retrieving lab report." });
  }
});

export default router;