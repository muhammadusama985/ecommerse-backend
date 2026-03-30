import mongoose from "mongoose";
import { Product } from "../../models/product.model.js";
import { Review } from "../../models/review.model.js";
import { asyncHandler } from "../../utils/async-handler.js";

const syncProductRating = async (productId) => {
  const stats = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        isApproved: true,
      },
    },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const nextValues =
    stats[0] || {
      averageRating: 0,
      reviewCount: 0,
    };

  await Product.findByIdAndUpdate(productId, {
    averageRating: Number(nextValues.averageRating?.toFixed(1) || 0),
    reviewCount: nextValues.reviewCount,
  });
};

const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment } = req.validated.body;

  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const existingReview = await Review.findOne({
    productId,
    userId: req.user._id,
  });

  if (existingReview) {
    const error = new Error("You have already reviewed this product.");
    error.statusCode = 409;
    throw error;
  }

  const review = await Review.create({
    productId,
    userId: req.user._id,
    rating,
    title,
    comment,
  });

  await syncProductRating(productId);

  res.status(201).json({
    success: true,
    message: "Review submitted successfully.",
    data: review,
  });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) {
    const error = new Error("Review not found.");
    error.statusCode = 404;
    throw error;
  }

  await Review.findByIdAndDelete(review._id);
  await syncProductRating(review.productId);

  res.json({
    success: true,
    message: "Review deleted successfully.",
  });
});

export { createReview, deleteReview };
