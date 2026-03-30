import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { addCartItemSchema, cartItemIdSchema, updateCartItemSchema } from "../../validators/cart.validators.js";
import { validateCouponCodeSchema } from "../../validators/coupon.validators.js";
import {
  addCartItem,
  applyCoupon,
  clearCart,
  getCart,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from "./cart.controller.js";

const cartRouter = Router();

cartRouter.use(authenticate);

cartRouter.get("/", getCart);
cartRouter.post("/items", validate(addCartItemSchema), addCartItem);
cartRouter.patch("/items/:itemId", validate(updateCartItemSchema), updateCartItem);
cartRouter.delete("/items/:itemId", validate(cartItemIdSchema), removeCartItem);
cartRouter.post("/coupon", validate(validateCouponCodeSchema), applyCoupon);
cartRouter.delete("/coupon", removeCoupon);
cartRouter.delete("/", clearCart);

export { cartRouter };
