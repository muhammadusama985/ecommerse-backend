import { Order } from "../../models/order.model.js";
import { Product } from "../../models/product.model.js";
import { Review } from "../../models/review.model.js";
import { User } from "../../models/user.model.js";
import { asyncHandler } from "../../utils/async-handler.js";

const getRevenueRecognizedAt = (order) => {
  if (order.revenueRecognizedAt) {
    return order.revenueRecognizedAt;
  }

  if (order.paymentMethod === "stripe" && ["paid", "refunded"].includes(order.paymentStatus)) {
    return order.createdAt;
  }

  if (order.paymentMethod === "cod" && order.orderStatus === "delivered") {
    return order.updatedAt;
  }

  return null;
};

const getRevenueCancelledAt = (order) => {
  if (order.revenueCancelledAt) {
    return order.revenueCancelledAt;
  }

  if (["refunded", "completed"].includes(order.returnStatus) && getRevenueRecognizedAt(order)) {
    return order.updatedAt;
  }

  return order.orderStatus === "cancelled" && getRevenueRecognizedAt(order) ? order.updatedAt : null;
};

const syncProductRating = async (productId) => {
  const [stats] = await Review.aggregate([
    {
      $match: {
        productId,
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

  await Product.findByIdAndUpdate(productId, {
    averageRating: Number(stats?.averageRating?.toFixed(1) || 0),
    reviewCount: stats?.reviewCount || 0,
  });
};

const getDashboardStats = asyncHandler(async (_req, res) => {
  const [usersCount, productsCount, ordersCount, reviewsCount, allOrders, recentOrders, outOfStockProducts] = await Promise.all([
    User.countDocuments({}),
    Product.countDocuments({}),
    Order.countDocuments({}),
    Review.countDocuments({}),
    Order.find({})
      .select("totalAmount paymentMethod paymentStatus orderStatus cancelledBy revenueRecognizedAt revenueCancelledAt createdAt updatedAt"),
    Order.find({}).populate("userId", "firstName lastName email").sort({ createdAt: -1 }),
    Product.find({ isActive: true, stock: { $lte: 0 } })
      .select("name slug stock images")
      .sort({ updatedAt: -1 }),
  ]);

  const totals = allOrders.reduce(
    (accumulator, order) => {
      const recognizedAt = getRevenueRecognizedAt(order);
      const cancelledAt = getRevenueCancelledAt(order);

      if (recognizedAt && !cancelledAt) {
        accumulator.totalRevenue += order.totalAmount || 0;

        if (order.paymentMethod === "stripe") {
          accumulator.stripeRevenue += order.totalAmount || 0;
        }

        if (order.paymentMethod === "cod") {
          accumulator.codRevenue += order.totalAmount || 0;
        }
      }

      if (order.orderStatus === "cancelled") {
        accumulator.cancelledOrdersCount += 1;
      }

      if (order.cancelledBy === "admin") {
        accumulator.cancelledByAdminCount += 1;
      }

      if (order.cancelledBy === "customer") {
        accumulator.cancelledByCustomerCount += 1;
      }

      return accumulator;
    },
    {
      totalRevenue: 0,
      stripeRevenue: 0,
      codRevenue: 0,
      cancelledOrdersCount: 0,
      cancelledByAdminCount: 0,
      cancelledByCustomerCount: 0,
    },
  );

  res.json({
    success: true,
    data: {
      usersCount,
      productsCount,
      ordersCount,
      reviewsCount,
      totalRevenue: totals.totalRevenue,
      stripeRevenue: totals.stripeRevenue,
      codRevenue: totals.codRevenue,
      cancelledOrdersCount: totals.cancelledOrdersCount,
      cancelledByAdminCount: totals.cancelledByAdminCount,
      cancelledByCustomerCount: totals.cancelledByCustomerCount,
      recentOrders,
      outOfStockProducts,
      outOfStockCount: outOfStockProducts.length,
    },
  });
});

const listRevenueRecords = asyncHandler(async (_req, res) => {
  const orders = await Order.find({})
    .populate("userId", "firstName lastName email")
    .sort({ updatedAt: -1, createdAt: -1 });

  const records = orders
    .flatMap((order) => {
      const customerName = [order.userId?.firstName, order.userId?.lastName].filter(Boolean).join(" ").trim();
      const customer = customerName || order.userId?.email || "Customer";
      const events = [];
      const recognizedAt = getRevenueRecognizedAt(order);

      if (recognizedAt) {
        events.push({
          id: `${order._id}-recognized`,
          type: "recognized",
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentMethod: order.paymentMethod,
          customer,
          amount: order.totalAmount,
          date: recognizedAt,
          note:
            order.paymentMethod === "stripe"
              ? "Revenue recorded automatically after Stripe payment."
              : "Revenue recorded after COD order was delivered.",
        });
      }

      const cancelledAt = getRevenueCancelledAt(order);

      if (cancelledAt) {
        events.push({
          id: `${order._id}-cancelled`,
          type: "cancelled",
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentMethod: order.paymentMethod,
          customer,
          amount: order.totalAmount,
          date: cancelledAt,
          cancelledBy: order.cancelledBy || null,
          note:
            order.paymentMethod === "stripe"
              ? "Revenue removed because the order was cancelled and the Stripe payment was refunded automatically."
              : "Revenue removed because the COD order was cancelled.",
        });
      }

      return events;
    })
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  res.json({
    success: true,
    data: records,
  });
});

const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({}).select("-password").sort({ createdAt: -1 });

  res.json({
    success: true,
    data: users,
  });
});

const createUserFromAdmin = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, phone } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error("A user with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    role: role || "customer",
    phone,
  });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      addresses: user.addresses,
    },
  });
});

const updateUserFromAdmin = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  delete payload.password;

  const user = await User.findByIdAndUpdate(req.params.userId, payload, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      addresses: user.addresses,
    },
  });
});

const deleteUserFromAdmin = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, message: "User deleted successfully." });
});

const listProductsForAdmin = asyncHandler(async (_req, res) => {
  const products = await Product.find({}).populate("categoryId", "name slug").sort({ createdAt: -1 });

  res.json({
    success: true,
    data: products,
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.productId);

  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  await Review.deleteMany({ productId: product._id });

  res.json({
    success: true,
    message: "Product deleted successfully.",
  });
});

const listReviewsForAdmin = asyncHandler(async (_req, res) => {
  const reviews = await Review.find({})
    .populate("productId", "name slug")
    .populate("userId", "firstName lastName email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: reviews,
  });
});

const updateReviewFromAdmin = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.reviewId,
    req.validated?.body || req.body,
    {
      new: true,
      runValidators: true,
    },
  )
    .populate("productId", "name slug")
    .populate("userId", "firstName lastName email");

  if (!review) {
    const error = new Error("Review not found.");
    error.statusCode = 404;
    throw error;
  }

  await syncProductRating(review.productId._id);

  res.json({
    success: true,
    data: review,
    message: "Review updated successfully.",
  });
});

const deleteReviewFromAdmin = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.reviewId);

  if (!review) {
    const error = new Error("Review not found.");
    error.statusCode = 404;
    throw error;
  }

  await syncProductRating(review.productId);

  res.json({
    success: true,
    message: "Review deleted successfully.",
  });
});

export {
  getDashboardStats,
  listUsers,
  createUserFromAdmin,
  updateUserFromAdmin,
  deleteUserFromAdmin,
  listProductsForAdmin,
  deleteProduct,
  listReviewsForAdmin,
  updateReviewFromAdmin,
  deleteReviewFromAdmin,
  listRevenueRecords,
};
