import { Category } from "../../models/category.model.js";
import { Page } from "../../models/page.model.js";
import { Product } from "../../models/product.model.js";
import { asyncHandler } from "../../utils/async-handler.js";

const MAX_PRODUCTS = 4;
const MAX_CATEGORIES = 4;

function normalizeMessage(message = "") {
  return String(message).trim().toLowerCase();
}

function makeSuggestions(...items) {
  return [...new Set(items.filter(Boolean))].slice(0, 4);
}

function mapProduct(product) {
  return {
    _id: product._id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    images: product.images || [],
    shortDescription: product.shortDescription || "",
    categoryId: product.categoryId,
    isBestSeller: Boolean(product.isBestSeller),
    isFeatured: Boolean(product.isFeatured),
  };
}

function mapCategory(category) {
  return {
    _id: category._id,
    name: category.name,
    description: category.description || "",
    image: category.image || "",
    slug: category.slug,
  };
}

async function findCategoriesByIntent(normalizedMessage) {
  const intentMap = [
    { keywords: ["skincare", "skin care", "skin", "العناية بالبشرة", "بشرة"], query: /skincare|skin/i },
    { keywords: ["makeup", "cosmetic", "cosmetics", "مكياج"], query: /makeup/i },
    { keywords: ["hair", "haircare", "الشعر", "عناية بالشعر"], query: /hair/i },
    { keywords: ["fragrance", "fragrances", "perfume", "عطر", "عطور"], query: /fragrance|perfume/i },
  ];

  const matchedIntent = intentMap.find(({ keywords }) => keywords.some((keyword) => normalizedMessage.includes(keyword)));
  if (!matchedIntent) return [];

  return Category.find({ isActive: true, name: matchedIntent.query }).sort({ sortOrder: 1, name: 1 }).limit(MAX_CATEGORIES);
}

async function findProductsBySearch(normalizedMessage) {
  const search = normalizedMessage.replace(/\b(show|find|need|want|guide|help|for|me|products?|please)\b/g, "").trim();
  if (!search) return [];

  return Product.find({
    isActive: true,
    $or: [
      { name: { $regex: search, $options: "i" } },
      { shortDescription: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ],
  })
    .populate("categoryId", "name slug")
    .sort({ soldCount: -1, averageRating: -1, createdAt: -1 })
    .limit(MAX_PRODUCTS);
}

const postChatbotMessage = asyncHandler(async (req, res) => {
  const normalizedMessage = normalizeMessage(req.body?.message);

  if (!normalizedMessage) {
    res.json({
      success: true,
      data: {
        reply:
          "Hi, I'm your shopping assistant. Ask me about skincare, makeup, best sellers, featured products, shipping, returns, or payment methods.",
        products: [],
        categories: [],
        suggestions: makeSuggestions("Show best sellers", "Show featured products", "Skincare products", "Return policy"),
      },
    });
    return;
  }

  if (normalizedMessage.includes("best seller") || normalizedMessage.includes("top selling") || normalizedMessage.includes("الأكثر") || normalizedMessage.includes("bestselling")) {
    const products = await Product.find({ isActive: true, isBestSeller: true })
      .populate("categoryId", "name slug")
      .sort({ soldCount: -1, averageRating: -1, createdAt: -1 })
      .limit(MAX_PRODUCTS);

    res.json({
      success: true,
      data: {
        reply: "Here are some of our current best-selling products.",
        products: products.map(mapProduct),
        categories: [],
        suggestions: makeSuggestions("Featured products", "Skincare products", "Makeup products"),
      },
    });
    return;
  }

  if (normalizedMessage.includes("featured") || normalizedMessage.includes("recommended") || normalizedMessage.includes("popular") || normalizedMessage.includes("مميزة")) {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1, averageRating: -1 })
      .limit(MAX_PRODUCTS);

    res.json({
      success: true,
      data: {
        reply: "These featured products are a great place to start.",
        products: products.map(mapProduct),
        categories: [],
        suggestions: makeSuggestions("Best sellers", "Makeup products", "All products"),
      },
    });
    return;
  }

  if (normalizedMessage.includes("category") || normalizedMessage.includes("categories") || normalizedMessage.includes("الفئات")) {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).limit(MAX_CATEGORIES);

    res.json({
      success: true,
      data: {
        reply: "Here are some product categories you can explore.",
        products: [],
        categories: categories.map(mapCategory),
        suggestions: makeSuggestions("Skincare products", "Makeup products", "Best sellers"),
      },
    });
    return;
  }

  if (["shipping", "delivery", "ship", "shipping cost", "الشحن", "التوصيل"].some((keyword) => normalizedMessage.includes(keyword))) {
    res.json({
      success: true,
      data: {
        reply:
          "We can guide customers about shipping during checkout. Shipping costs are calculated before order placement, and free-shipping promotions may also be available.",
        products: [],
        categories: [],
        suggestions: makeSuggestions("Payment methods", "Return policy", "Best sellers"),
      },
    });
    return;
  }

  if (["return", "refund", "exchange", "returns", "refunds", "الاسترجاع", "الإرجاع"].some((keyword) => normalizedMessage.includes(keyword))) {
    const returnPage = await Page.findOne({
      isPublished: true,
      slug: { $in: ["returns", "return-policy", "refund-policy"] },
    }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: {
        reply: returnPage?.content
          ? `${returnPage.title}: ${returnPage.content.slice(0, 260)}${returnPage.content.length > 260 ? "..." : ""}`
          : "For returns and refunds, please check the return policy page or contact support before placing your order.",
        products: [],
        categories: [],
        suggestions: makeSuggestions("Contact info", "Shipping info", "Payment methods"),
      },
    });
    return;
  }

  if (["payment", "pay", "stripe", "cod", "cash on delivery", "الدفع"].some((keyword) => normalizedMessage.includes(keyword))) {
    res.json({
      success: true,
      data: {
        reply: "We currently support secure card payments through Stripe and cash on delivery where available.",
        products: [],
        categories: [],
        suggestions: makeSuggestions("Shipping info", "Best sellers", "Checkout help"),
      },
    });
    return;
  }

  if (["about", "company", "brand", "من نحن", "about us"].some((keyword) => normalizedMessage.includes(keyword))) {
    const aboutPage = await Page.findOne({
      isPublished: true,
      slug: { $in: ["about", "about-us"] },
    }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: {
        reply: aboutPage?.content
          ? `${aboutPage.title}: ${aboutPage.content.slice(0, 260)}${aboutPage.content.length > 260 ? "..." : ""}`
          : "Nature Republic is your beauty storefront for skincare, makeup, haircare, and fragrance.",
        products: [],
        categories: [],
        suggestions: makeSuggestions("Contact info", "Best sellers", "Featured products"),
      },
    });
    return;
  }

  if (["contact", "support", "help", "customer care", "اتصل", "الدعم"].some((keyword) => normalizedMessage.includes(keyword))) {
    const contactPage = await Page.findOne({
      isPublished: true,
      slug: { $in: ["contact", "contact-us"] },
    }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: {
        reply: contactPage?.content
          ? `${contactPage.title}: ${contactPage.content.slice(0, 260)}${contactPage.content.length > 260 ? "..." : ""}`
          : "You can use the contact page for store support, or continue browsing products and policies here on the site.",
        products: [],
        categories: [],
        suggestions: makeSuggestions("Return policy", "Shipping info", "All products"),
      },
    });
    return;
  }

  const intentCategories = await findCategoriesByIntent(normalizedMessage);
  if (intentCategories.length) {
    const categoryIds = intentCategories.map((item) => item._id);
    const products = await Product.find({ isActive: true, categoryId: { $in: categoryIds } })
      .populate("categoryId", "name slug")
      .sort({ soldCount: -1, averageRating: -1, createdAt: -1 })
      .limit(MAX_PRODUCTS);

    res.json({
      success: true,
      data: {
        reply: `Here are some products from ${intentCategories.map((item) => item.name).join(", ")}.`,
        products: products.map(mapProduct),
        categories: intentCategories.map(mapCategory),
        suggestions: makeSuggestions("Best sellers", "Featured products", "All products"),
      },
    });
    return;
  }

  const searchedProducts = await findProductsBySearch(normalizedMessage);
  if (searchedProducts.length) {
    res.json({
      success: true,
      data: {
        reply: "I found these products that may match what you're looking for.",
        products: searchedProducts.map(mapProduct),
        categories: [],
        suggestions: makeSuggestions("Best sellers", "Featured products", "Categories"),
      },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      reply:
        "I can help with products, categories, best sellers, featured items, shipping, payment methods, and general store information. Try one of the suggestions below.",
      products: [],
      categories: [],
      suggestions: makeSuggestions("Show best sellers", "Show categories", "Shipping info", "Return policy"),
    },
  });
});

export { postChatbotMessage };
