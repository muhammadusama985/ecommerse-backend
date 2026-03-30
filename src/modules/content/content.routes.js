import { Router } from "express";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import {
  createBannerSchema,
  createBlogPostSchema,
  createPageSchema,
  updateBannerSchema,
  updateBlogPostSchema,
  updatePageSchema,
  updateSettingSchema,
} from "../../validators/content.validators.js";
import {
  createBanner,
  createBlogPost,
  createPage,
  deleteBanner,
  deleteBlogPost,
  deletePage,
  getBlogPostBySlug,
  getPageBySlug,
  listActiveBanners,
  listAllBlogPosts,
  listBanners,
  listBlogPosts,
  listPages,
  listSettings,
  updateBanner,
  updateBlogPost,
  updatePage,
  updateSetting,
} from "./content.controller.js";

const contentRouter = Router();
const adminContentRouter = Router();

contentRouter.get("/blog", listBlogPosts);
contentRouter.get("/blog/:slug", getBlogPostBySlug);
contentRouter.get("/pages/:slug", getPageBySlug);
contentRouter.get("/banners", listActiveBanners);

adminContentRouter.use(authenticate, requireRole("admin"));
adminContentRouter.get("/blog", listAllBlogPosts);
adminContentRouter.post("/blog", validate(createBlogPostSchema), createBlogPost);
adminContentRouter.patch("/blog/:postId", validate(updateBlogPostSchema), updateBlogPost);
adminContentRouter.delete("/blog/:postId", deleteBlogPost);
adminContentRouter.get("/pages", listPages);
adminContentRouter.post("/pages", validate(createPageSchema), createPage);
adminContentRouter.patch("/pages/:pageId", validate(updatePageSchema), updatePage);
adminContentRouter.delete("/pages/:pageId", deletePage);
adminContentRouter.get("/banners", listBanners);
adminContentRouter.post("/banners", validate(createBannerSchema), createBanner);
adminContentRouter.patch("/banners/:bannerId", validate(updateBannerSchema), updateBanner);
adminContentRouter.delete("/banners/:bannerId", deleteBanner);
adminContentRouter.get("/settings", listSettings);
adminContentRouter.put("/settings/:key", validate(updateSettingSchema), updateSetting);

export { contentRouter, adminContentRouter };
