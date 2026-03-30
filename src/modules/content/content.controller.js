import { Banner } from "../../models/banner.model.js";
import { BlogPost } from "../../models/blog-post.model.js";
import { Page } from "../../models/page.model.js";
import { Setting } from "../../models/setting.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { slugify } from "../../utils/slugify.js";

const listBlogPosts = asyncHandler(async (_req, res) => {
  const posts = await BlogPost.find({ isPublished: true }).sort({ publishedAt: -1 });
  res.json({ success: true, data: posts });
});

const getBlogPostBySlug = asyncHandler(async (req, res) => {
  const post = await BlogPost.findOne({ slug: req.params.slug, isPublished: true });
  if (!post) {
    const error = new Error("Blog post not found.");
    error.statusCode = 404;
    throw error;
  }
  res.json({ success: true, data: post });
});

const getPageBySlug = asyncHandler(async (req, res) => {
  const page = await Page.findOne({ slug: req.params.slug, isPublished: true });
  if (!page) {
    const error = new Error("Page not found.");
    error.statusCode = 404;
    throw error;
  }
  res.json({ success: true, data: page });
});

const listActiveBanners = asyncHandler(async (_req, res) => {
  const now = new Date();
  const banners = await Banner.find({
    isActive: true,
    $and: [
      { $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: now } }] },
    ],
  }).sort({ placement: 1, sortOrder: 1 });
  const settings = await Setting.find({ key: { $in: ["promoBarText", "heroTitle", "heroSubtitle", "heroCtaLabel"] } });
  res.json({
    success: true,
    data: {
      banners,
      settings: Object.fromEntries(settings.map((setting) => [setting.key, setting.value])),
    },
  });
});

const createBlogPost = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const post = await BlogPost.create({
    ...payload,
    slug: slugify(payload.title),
  });
  res.status(201).json({ success: true, data: post });
});

const updateBlogPost = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  if (payload.title) {
    payload.slug = slugify(payload.title);
  }
  const post = await BlogPost.findByIdAndUpdate(req.params.postId, payload, { new: true, runValidators: true });
  if (!post) {
    const error = new Error("Blog post not found.");
    error.statusCode = 404;
    throw error;
  }
  res.json({ success: true, data: post });
});

const deleteBlogPost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findByIdAndDelete(req.params.postId);
  if (!post) {
    const error = new Error("Blog post not found.");
    error.statusCode = 404;
    throw error;
  }
  res.json({ success: true, message: "Blog post deleted successfully." });
});

const listAllBlogPosts = asyncHandler(async (_req, res) => {
  const posts = await BlogPost.find({}).sort({ updatedAt: -1 });
  res.json({ success: true, data: posts });
});

const listPages = asyncHandler(async (_req, res) => {
  const pages = await Page.find({}).sort({ updatedAt: -1 });
  res.json({ success: true, data: pages });
});

const createPage = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const page = await Page.create({
    ...payload,
    slug: slugify(payload.title),
  });
  res.status(201).json({ success: true, data: page });
});

const updatePage = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  if (payload.title) {
    payload.slug = slugify(payload.title);
  }
  const page = await Page.findByIdAndUpdate(req.params.pageId, payload, { new: true, runValidators: true });
  if (!page) {
    const error = new Error("Page not found.");
    error.statusCode = 404;
    throw error;
  }
  res.json({ success: true, data: page });
});

const deletePage = asyncHandler(async (req, res) => {
  const page = await Page.findByIdAndDelete(req.params.pageId);
  if (!page) {
    const error = new Error("Page not found.");
    error.statusCode = 404;
    throw error;
  }
  res.json({ success: true, message: "Page deleted successfully." });
});

const listBanners = asyncHandler(async (_req, res) => {
  const banners = await Banner.find({}).sort({ placement: 1, sortOrder: 1 });
  res.json({ success: true, data: banners });
});

const createBanner = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const banner = await Banner.create({
    ...payload,
    startDate: payload.startDate ? new Date(payload.startDate) : undefined,
    endDate: payload.endDate ? new Date(payload.endDate) : undefined,
  });
  res.status(201).json({ success: true, data: banner });
});

const updateBanner = asyncHandler(async (req, res) => {
  const payload = {
    ...req.validated.body,
    ...(req.validated.body.startDate !== undefined ? { startDate: req.validated.body.startDate ? new Date(req.validated.body.startDate) : null } : {}),
    ...(req.validated.body.endDate !== undefined ? { endDate: req.validated.body.endDate ? new Date(req.validated.body.endDate) : null } : {}),
  };

  const banner = await Banner.findByIdAndUpdate(req.params.bannerId, payload, {
    new: true,
    runValidators: true,
  });
  if (!banner) {
    const error = new Error("Banner not found.");
    error.statusCode = 404;
    throw error;
  }
  res.json({ success: true, data: banner });
});

const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.bannerId);
  if (!banner) {
    const error = new Error("Banner not found.");
    error.statusCode = 404;
    throw error;
  }
  res.json({ success: true, message: "Banner deleted successfully." });
});

const listSettings = asyncHandler(async (_req, res) => {
  const settings = await Setting.find({});
  res.json({ success: true, data: settings });
});

const updateSetting = asyncHandler(async (req, res) => {
  const setting = await Setting.findOneAndUpdate(
    { key: req.params.key },
    { key: req.params.key, value: req.validated.body.value },
    { upsert: true, new: true, runValidators: true },
  );
  res.json({ success: true, data: setting });
});

export {
  listBlogPosts,
  getBlogPostBySlug,
  getPageBySlug,
  listActiveBanners,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  listAllBlogPosts,
  listPages,
  createPage,
  updatePage,
  deletePage,
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  listSettings,
  updateSetting,
};
