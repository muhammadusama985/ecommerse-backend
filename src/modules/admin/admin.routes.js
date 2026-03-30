import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { updateReviewByAdminSchema } from "../../validators/review.validators.js";
import {
  createUserFromAdmin,
  deleteReviewFromAdmin,
  deleteProduct,
  deleteUserFromAdmin,
  getDashboardStats,
  listRevenueRecords,
  listProductsForAdmin,
  listReviewsForAdmin,
  listUsers,
  updateReviewFromAdmin,
  updateUserFromAdmin,
} from "./admin.controller.js";

const adminRouter = Router();

adminRouter.use(authenticate, requireRole("admin"));

adminRouter.get("/dashboard", getDashboardStats);
adminRouter.get("/revenue", listRevenueRecords);
adminRouter.get("/users", listUsers);
adminRouter.post("/users", createUserFromAdmin);
adminRouter.patch("/users/:userId", updateUserFromAdmin);
adminRouter.delete("/users/:userId", deleteUserFromAdmin);
adminRouter.get("/products", listProductsForAdmin);
adminRouter.delete("/products/:productId", deleteProduct);
adminRouter.get("/reviews", listReviewsForAdmin);
adminRouter.patch("/reviews/:reviewId", validate(updateReviewByAdminSchema), updateReviewFromAdmin);
adminRouter.delete("/reviews/:reviewId", deleteReviewFromAdmin);

export { adminRouter };
