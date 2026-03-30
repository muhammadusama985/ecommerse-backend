import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { z } from "zod";
import {
  createOrderShipment,
  createOrderReturnShipment,
  getAramexRate,
  getShippingConfigStatus,
  trackOrderShipment,
  trackOrderReturnShipment,
} from "./shipping.controller.js";

const shippingRouter = Router();

const rateSchema = z.object({
  body: z.object({
    addressId: z.string(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const orderIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    orderId: z.string(),
  }),
  query: z.object({}).optional(),
});

shippingRouter.get("/config", authenticate, getShippingConfigStatus);
shippingRouter.post("/aramex/rate", authenticate, validate(rateSchema), getAramexRate);
shippingRouter.post("/aramex/orders/:orderId/shipment", authenticate, requireRole("admin"), validate(orderIdSchema), createOrderShipment);
shippingRouter.post("/aramex/orders/:orderId/return-shipment", authenticate, requireRole("admin"), validate(orderIdSchema), createOrderReturnShipment);
shippingRouter.get("/aramex/orders/:orderId/tracking", authenticate, validate(orderIdSchema), trackOrderShipment);
shippingRouter.get("/aramex/orders/:orderId/return-tracking", authenticate, validate(orderIdSchema), trackOrderReturnShipment);

export { shippingRouter };
