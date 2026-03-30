import { Router } from "express";
import { translateBatch } from "./translate.controller.js";

const translateRouter = Router();

translateRouter.post("/batch", translateBatch);

export { translateRouter };
