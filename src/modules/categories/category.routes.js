import { Router } from "express";
import { createCategory, deleteCategory, listCategories, updateCategory } from "./category.controller.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { createCategorySchema, updateCategorySchema } from "../../validators/category.validators.js";

const categoryRouter = Router();

categoryRouter.get("/", listCategories);
categoryRouter.post("/", authenticate, requireRole("admin"), validate(createCategorySchema), createCategory);
categoryRouter.patch(
  "/:categoryId",
  authenticate,
  requireRole("admin"),
  validate(updateCategorySchema),
  updateCategory,
);
categoryRouter.delete("/:categoryId", authenticate, requireRole("admin"), deleteCategory);

export { categoryRouter };
