import { Router } from "express";
import {
  addAddress,
  addToWishlist,
  getProfile,
  listWishlist,
  removeAddress,
  removeFromWishlist,
  updateProfile,
} from "./user.controller.js";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { addAddressSchema, addressIdSchema, updateProfileSchema } from "../../validators/user.validators.js";

const userRouter = Router();

userRouter.use(authenticate);

userRouter.get("/me", getProfile);
userRouter.patch("/me", validate(updateProfileSchema), updateProfile);
userRouter.post("/addresses", validate(addAddressSchema), addAddress);
userRouter.delete("/addresses/:addressId", validate(addressIdSchema), removeAddress);
userRouter.get("/wishlist", listWishlist);
userRouter.post("/wishlist/:productId", addToWishlist);
userRouter.delete("/wishlist/:productId", removeFromWishlist);

export { userRouter };
