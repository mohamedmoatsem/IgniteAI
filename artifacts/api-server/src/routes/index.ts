import { Router, type IRouter } from "express";
import healthRouter from "./health";
import boardsRouter from "./boards";
import livelabRouter from "./livelab";
import assetJobsRouter from "./asset-jobs";
import careerRouter from "./career";

const router: IRouter = Router();

router.use(healthRouter);
router.use(boardsRouter);
router.use(livelabRouter);
router.use(assetJobsRouter);
router.use(careerRouter);

export default router;
