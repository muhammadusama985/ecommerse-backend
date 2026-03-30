import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponCodeSchema,
} from "../../validators/coupon.validators.js";
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
  validateCouponCode,
} from "./coupon.controller.js";

const couponRouter = Router();

couponRouter.post("/validate", authenticate, validate(validateCouponCodeSchema), validateCouponCode);
couponRouter.get("/", authenticate, requireRole("admin"), listCoupons);
couponRouter.post("/", authenticate, requireRole("admin"), validate(createCouponSchema), createCoupon);
couponRouter.patch(
  "/:couponId",
  authenticate,
  requireRole("admin"),
  validate(updateCouponSchema),
  updateCoupon,
);
couponRouter.delete("/:couponId", authenticate, requireRole("admin"), deleteCoupon);

export { couponRouter };
