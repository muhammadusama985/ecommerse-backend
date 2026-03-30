import { Product } from "../../models/product.model.js";
import { Review } from "../../models/review.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { slugify } from "../../utils/slugify.js";

const listProducts = asyncHandler(async (req, res) => {
  const { categoryId, search, featured, bestSeller, minRating, minPrice, maxPrice, sortBy } = req.query;

  const query = { isActive: true };

  if (categoryId) {
    query.categoryId = categoryId;
  }

  if (featured === "true") {
    query.isFeatured = true;
  }

  if (bestSeller === "true") {
    query.isBestSeller = true;
  }

  if (minRating) {
    query.averageRating = { $gte: Number(minRating) };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) {
      query.price.$gte = Number(minPrice);
    }
    if (maxPrice) {
      query.price.$lte = Number(maxPrice);
    }
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { shortDescription: { $regex: search, $options: "i" } },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    priceAsc: { price: 1 },
    priceDesc: { price: -1 },
    bestSelling: { soldCount: -1 },
    topRated: { averageRating: -1, reviewCount: -1 },
  };

  const products = await Product.find(query)
    .populate("categoryId", "name slug")
    .sort(sortMap[sortBy] || { createdAt: -1 });

  res.json({
    success: true,
    data: products,
  });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate(
    "categoryId",
    "name slug",
  );

  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const reviews = await Review.find({ productId: product._id, isApproved: true })
    .populate("userId", "firstName lastName")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      product,
      reviews,
    },
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const payload = req.validated.body;

  const product = await Product.create({
    ...payload,
    slug: slugify(payload.name),
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully.",
    data: product,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  if (payload.name) {
    payload.slug = slugify(payload.name);
  }

  const product = await Product.findByIdAndUpdate(req.params.productId, payload, {
    new: true,
    runValidators: true,
  }).populate("categoryId", "name slug");

  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    message: "Product updated successfully.",
    data: product,
  });
});

export { listProducts, getProductBySlug, createProduct, updateProduct };
