import { Banner } from "../../models/banner.model.js";
import { Category } from "../../models/category.model.js";
import { Product } from "../../models/product.model.js";
import { Setting } from "../../models/setting.model.js";
import { asyncHandler } from "../../utils/async-handler.js";

const getHomePageData = asyncHandler(async (_req, res) => {
  const [categories, featuredProducts, bestSellingProducts, newestProducts, banners, settings] = await Promise.all([
    Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).limit(8),
    Product.find({ isActive: true, isFeatured: true })
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .limit(8),
    Product.find({ isActive: true, isBestSeller: true })
      .populate("categoryId", "name slug")
      .sort({ soldCount: -1, averageRating: -1 })
      .limit(8),
    Product.find({ isActive: true })
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .limit(8),
    Banner.find({ isActive: true }).sort({ placement: 1, sortOrder: 1 }),
    Setting.find({ key: { $in: ["promoBarText", "heroTitle", "heroSubtitle", "heroCtaLabel"] } }),
  ]);

  const settingMap = Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));

  res.json({
    success: true,
    data: {
      hero: {
        title: settingMap.heroTitle || "Discover Your Natural Beauty",
        subtitle:
          settingMap.heroSubtitle ||
          "Premium beauty products that enhance your natural glow. From skincare essentials to luxury makeup, find everything you need.",
        ctaLabel: settingMap.heroCtaLabel || "Shop Now",
      },
      promoBar: {
        text: settingMap.promoBarText || "Free shipping on orders over AED 50 | Use code BEAUTY20 for your first order",
      },
      banners,
      categories,
      featuredProducts,
      bestSellingProducts,
      newestProducts,
    },
  });
});

const getBestSellerPageData = asyncHandler(async (_req, res) => {
  const [categories, products] = await Promise.all([
    Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }),
    Product.find({ isActive: true, isBestSeller: true })
      .populate("categoryId", "name slug")
      .sort({ soldCount: -1, averageRating: -1 }),
  ]);

  res.json({
    success: true,
    data: {
      heading: "Best Selling Items",
      description: "Discover our top-selling beauty products that customers absolutely love.",
      categories,
      products,
    },
  });
});

export { getHomePageData, getBestSellerPageData };
