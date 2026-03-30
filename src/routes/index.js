import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { categoryRouter } from "../modules/categories/category.routes.js";
import { cartRouter } from "../modules/cart/cart.routes.js";
import { adminContentRouter, contentRouter } from "../modules/content/content.routes.js";
import { couponRouter } from "../modules/coupons/coupon.routes.js";
import { orderRouter } from "../modules/orders/order.routes.js";
import { productRouter } from "../modules/products/product.routes.js";
import { reviewRouter } from "../modules/reviews/review.routes.js";
import { shippingRouter } from "../modules/shipping/shipping.routes.js";
import { storefrontRouter } from "../modules/storefront/storefront.routes.js";
import { translateRouter } from "../modules/translate/translate.routes.js";
import { uploadRouter } from "../modules/uploads/upload.routes.js";
import { userRouter } from "../modules/users/user.routes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/storefront", storefrontRouter);
apiRouter.use("/translate", translateRouter);
apiRouter.use("/content", contentRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/categories", categoryRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/reviews", reviewRouter);
apiRouter.use("/shipping", shippingRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/coupons", couponRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/admin/content", adminContentRouter);
apiRouter.use("/uploads", uploadRouter);

export { apiRouter };
