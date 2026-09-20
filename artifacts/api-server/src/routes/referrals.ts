import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  GenerateReferralBody,
  GenerateReferralResponse,
} from "@workspace/api-zod";
import { generateReferral } from "../lib/ai";
import { getPatient, saveReferral } from "../lib/sqlite";

const router: IRouter = Router();

router.post("/referrals/generate", async (req, res): Promise<void> => {
  const parsed = GenerateReferralBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "A patient_id is required.", details: parsed.error.message });
    return;
  }

  const patient = getPatient(parsed.data.patient_id);
  if (!patient) {
    res.status(404).json({ error: "Patient not found." });
    return;
  }

  try {
    const result = await generateReferral(patient);
    const saved = saveReferral({
      id: randomUUID(),
      patient_id: patient.id,
      referral_text: result.referralText,
      analysis_mode: result.analysisMode,
    });
    res.status(201).json(
      GenerateReferralResponse.parse({
        ...saved,
        created_at: new Date(saved.created_at),
      }),
    );
  } catch (error) {
    req.log.error({ err: error, patientId: patient.id }, "Referral generation failed");
    res.status(502).json({
      error: "Referral generation failed.",
      details: error instanceof Error ? error.message : "The AI service returned an error.",
    });
  }
});

export default router;