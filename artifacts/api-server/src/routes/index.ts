import { Router, type IRouter } from "express";
import healthRouter from "./health";
import boardsRouter from "./boards";
import livelabRouter from "./livelab";
import assetJobsRouter from "./asset-jobs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(boardsRouter);
router.use(livelabRouter);
router.use(assetJobsRouter);

export default router;
