import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  CreatePatientBody,
  CreatePatientResponse,
  GetPatientParams,
  GetPatientResponse,
  ListPatientsResponse,
} from "@workspace/api-zod";
import { createPatient, getPatient, listPatients } from "../lib/sqlite";

const router: IRouter = Router();

router.get("/patients", (_req, res): void => {
  const response = ListPatientsResponse.parse(listPatients());
  res.json(response);
});

router.post("/patients", (req, res): void => {
  const parsed = CreatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid patient record.", details: parsed.error.message });
    return;
  }

  try {
    const patient = createPatient({
      id: randomUUID(),
      ...parsed.data,
    });
    res.status(201).json(CreatePatientResponse.parse(patient));
  } catch (error) {
    req.log.error({ err: error }, "Failed to create patient");
    res.status(500).json({ error: "Database failure while creating patient." });
  }
});

router.get("/patients/:id", (req, res): void => {
  const params = GetPatientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid patient id.", details: params.error.message });
    return;
  }

  try {
    const patient = getPatient(params.data.id);
    if (!patient) {
      res.status(404).json({ error: "Patient not found." });
      return;
    }
    res.json(GetPatientResponse.parse(patient));
  } catch (error) {
    req.log.error({ err: error }, "Failed to retrieve patient");
    res.status(500).json({ error: "Database failure while retrieving patient." });
  }
});

export default router;