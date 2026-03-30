import { Router } from "express";
import { createProduct, getProductBySlug, listProducts, updateProduct } from "./product.controller.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { createProductSchema, updateProductSchema } from "../../validators/product.validators.js";

const productRouter = Router();

productRouter.get("/", listProducts);
productRouter.get("/:slug", getProductBySlug);
productRouter.post("/", authenticate, requireRole("admin"), validate(createProductSchema), createProduct);
productRouter.patch("/:productId", authenticate, requireRole("admin"), validate(updateProductSchema), updateProduct);

export { productRouter };
