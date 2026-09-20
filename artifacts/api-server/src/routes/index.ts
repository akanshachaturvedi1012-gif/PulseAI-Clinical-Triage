import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import labReportsRouter from "./lab-reports";
import referralsRouter from "./referrals";

const router: IRouter = Router();

router.use(healthRouter);
router.use(patientsRouter);
router.use(labReportsRouter);
router.use(referralsRouter);

export default router;
