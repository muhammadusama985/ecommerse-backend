import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  cancelOrderSchema,
  createOrderSchema,
  createPaymentIntentSchema,
  updateOrderShippingSchema,
  updateOrderStatusSchema,
  updateReturnStatusSchema,
} from "../../validators/order.validators.js";
import {
  cancelOrder,
  createOrder,
  createStripePaymentIntent,
  getOrderById,
  listAllOrders,
  listMyOrders,
  updateOrderShipping,
  updateOrderStatus,
  updateReturnStatus,
} from "./order.controller.js";

const orderRouter = Router();

orderRouter.use(authenticate);

orderRouter.get("/mine", listMyOrders);
orderRouter.post("/stripe/payment-intent", validate(createPaymentIntentSchema), createStripePaymentIntent);
orderRouter.get("/:orderId", getOrderById);
orderRouter.patch("/:orderId/cancel", validate(cancelOrderSchema), cancelOrder);
orderRouter.post("/", validate(createOrderSchema), createOrder);
orderRouter.get("/", requireRole("admin"), listAllOrders);
orderRouter.patch(
  "/:orderId/status",
  requireRole("admin"),
  validate(updateOrderStatusSchema),
  updateOrderStatus,
);
orderRouter.patch(
  "/:orderId/shipping",
  requireRole("admin"),
  validate(updateOrderShippingSchema),
  updateOrderShipping,
);
orderRouter.patch(
  "/:orderId/return-status",
  requireRole("admin"),
  validate(updateReturnStatusSchema),
  updateReturnStatus,
);

export { orderRouter };
