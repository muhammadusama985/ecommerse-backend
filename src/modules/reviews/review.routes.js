import { Router } from "express";
import { createReview, deleteReview } from "./review.controller.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { createReviewSchema } from "../../validators/review.validators.js";

const reviewRouter = Router();

reviewRouter.post("/", authenticate, validate(createReviewSchema), createReview);
reviewRouter.delete("/:reviewId", authenticate, requireRole("admin"), deleteReview);

export { reviewRouter };
