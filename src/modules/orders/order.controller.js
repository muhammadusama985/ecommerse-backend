import { Cart } from "../../models/cart.model.js";
import { Coupon } from "../../models/coupon.model.js";
import { Order } from "../../models/order.model.js";
import { User } from "../../models/user.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { createOrderNumber } from "../../utils/order-number.js";
import { sendEmail } from "../../services/email.service.js";
import { stripe } from "../../services/stripe.service.js";
import { calculateAramexRate } from "../../services/aramex.service.js";
import { createAramexReturnShipment } from "../../services/aramex.service.js";
import { assertProductStock, releaseOrderStock, reserveOrderStock } from "../../services/inventory.service.js";
import { applyCartTotals } from "../cart/cart.controller.js";

const buildOrderDraft = async (userId, addressId) => {
  const user = await User.findById(userId);
  const address = user?.addresses.id(addressId);

  if (!address) {
    const error = new Error("Shipping address not found.");
    error.statusCode = 404;
    throw error;
  }

  const cart = await Cart.findOne({ userId }).populate("items.productId");

  if (!cart || !cart.items.length) {
    const error = new Error("Cart is empty.");
    error.statusCode = 400;
    throw error;
  }

  await applyCartTotals(cart);

  await Promise.all(
    cart.items.map((item) =>
      assertProductStock(item.productId._id || item.productId, item.quantity, item.variantId),
    ),
  );

  const items = cart.items.map((item) => ({
    productId: item.productId._id,
    variantId: item.variantId,
    name: item.productId.name,
    image: item.productId.images[0] || "",
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.quantity * item.unitPrice,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingQuote = await calculateAramexRate({
    address,
    items,
  });
  const shippingAmount = shippingQuote.shippingAmount || 0;
  const discountAmount = cart.discountAmount || 0;
  const totalAmount = subtotal + shippingAmount - discountAmount;

  return {
    user,
    address,
    cart,
    items,
    subtotal,
    shippingQuote,
    shippingAmount,
    discountAmount,
    totalAmount,
  };
};

const canCancelOrder = (order) => !["cancelled", "delivered"].includes(order.orderStatus);
const canRequestReturn = (order) => order.orderStatus === "delivered" && ["none", "rejected"].includes(order.returnStatus || "none");

const shouldRecognizeRevenue = (order) =>
  (order.paymentMethod === "stripe" && order.paymentStatus === "paid") ||
  (order.paymentMethod === "cod" && order.orderStatus === "delivered");

const recognizeRevenueIfEligible = (order, timestamp = new Date()) => {
  if (shouldRecognizeRevenue(order) && !order.revenueRecognizedAt) {
    order.revenueRecognizedAt = timestamp;
  }

  if (order.revenueRecognizedAt && order.orderStatus !== "cancelled") {
    order.revenueCancelledAt = null;
  }
};

const restoreReturnedStockIfNeeded = async (order) => {
  if (order.returnRestockedAt) {
    return;
  }

  await releaseOrderStock(order.items);
  order.returnRestockedAt = new Date();
};

const syncOrderShippingStatus = (order, nextStatus) => {
  if (nextStatus === "shipped") {
    order.shippingStatus = order.trackingNumber ? "in_transit" : order.shippingStatus;
  }

  if (nextStatus === "delivered") {
    order.shippingStatus = "delivered";
  }
};

const getCancellationSuccessMessage = (order) =>
  order.paymentMethod === "stripe" && order.paymentStatus === "refunded"
    ? "Order cancelled successfully and the Stripe refund has been initiated."
    : "Order cancelled successfully.";

const refundStripeOrderIfNeeded = async (order) => {
  if (order.paymentMethod !== "stripe" || order.paymentStatus !== "paid") {
    return order.paymentStatus;
  }

  if (!stripe) {
    const error = new Error("Stripe refund could not be processed because Stripe is not configured.");
    error.statusCode = 500;
    throw error;
  }

  if (!order.stripePaymentIntentId) {
    const error = new Error("Stripe refund could not be processed because the payment intent is missing.");
    error.statusCode = 400;
    throw error;
  }

  const refunds = await stripe.refunds.list({
    payment_intent: order.stripePaymentIntentId,
    limit: 1,
  });

  if (refunds.data.length) {
    return "refunded";
  }

  const refund = await stripe.refunds.create({
    payment_intent: order.stripePaymentIntentId,
  });

  if (!["succeeded", "pending"].includes(refund.status)) {
    const error = new Error("Stripe refund could not be completed, so the order was not cancelled.");
    error.statusCode = 400;
    throw error;
  }

  return "refunded";
};

const cancelOrderRecord = async (order, { actor = "customer", reason = "" } = {}) => {
  if (!canCancelOrder(order)) {
    const error = new Error(
      order.orderStatus === "delivered"
        ? "Delivered orders cannot be cancelled."
        : "This order has already been cancelled.",
    );
    error.statusCode = 400;
    throw error;
  }

  if (actor === "admin" && !reason.trim()) {
    const error = new Error("Please enter a cancellation reason before cancelling this order.");
    error.statusCode = 400;
    throw error;
  }

  const nextPaymentStatus = await refundStripeOrderIfNeeded(order);
  await releaseOrderStock(order.items);

  order.orderStatus = "cancelled";
  order.paymentStatus = nextPaymentStatus;
  order.shippingStatus = "pending";
  if (order.revenueRecognizedAt && !order.revenueCancelledAt) {
    order.revenueCancelledAt = new Date();
  }
  order.cancelledBy = actor;
  order.cancellationReason = reason.trim() || undefined;
  await order.save();

  if (order.couponCode) {
    await Coupon.findOneAndUpdate(
      { code: order.couponCode, usedCount: { $gt: 0 } },
      { $inc: { usedCount: -1 } },
    );
  }

  return order.populate("userId", "firstName lastName email");
};

const createStripePaymentIntent = asyncHandler(async (req, res) => {
  const { addressId } = req.validated.body;

  if (!stripe) {
    const error = new Error("Stripe is not configured yet.");
    error.statusCode = 500;
    throw error;
  }

  const draft = await buildOrderDraft(req.user._id, addressId);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(draft.totalAmount * 100),
    currency: "aed",
    payment_method_types: ["card"],
    metadata: {
      userId: req.user._id.toString(),
      addressId,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: draft.totalAmount,
      currency: "AED",
    },
  });
});

const createOrder = asyncHandler(async (req, res) => {
  const { addressId, paymentMethod, paymentIntentId, notes } = req.validated.body;
  const { user, address, cart, items, subtotal, shippingQuote, shippingAmount, discountAmount, totalAmount } = await buildOrderDraft(
    req.user._id,
    addressId,
  );

  const orderData = {
    orderNumber: createOrderNumber(),
    userId: req.user._id,
    items,
    shippingAddress: {
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      country: address.country,
      city: address.city,
      area: address.area,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      postalCode: address.postalCode,
    },
    subtotal,
    shippingAmount,
    discountAmount,
    couponCode: cart.couponCode,
    totalAmount,
    shippingProvider: shippingQuote.provider || "aramex",
    shippingStatus: shippingQuote.configured ? "quoted" : "pending",
    shippingMeta: shippingQuote.raw || {},
    paymentMethod,
    paymentStatus: paymentMethod === "stripe" ? "paid" : "pending",
    revenueRecognizedAt: paymentMethod === "stripe" ? new Date() : null,
    notes,
  };

  if (paymentMethod === "stripe") {
    if (!stripe) {
      const error = new Error("Stripe is not configured yet.");
      error.statusCode = 500;
      throw error;
    }

    if (!paymentIntentId) {
      const error = new Error("Stripe payment intent is required.");
      error.statusCode = 400;
      throw error;
    }

    const existingOrder = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
    if (existingOrder) {
      const error = new Error("This Stripe payment has already been used.");
      error.statusCode = 409;
      throw error;
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata?.userId !== req.user._id.toString()) {
      const error = new Error("Stripe payment does not belong to this customer.");
      error.statusCode = 403;
      throw error;
    }

    if (paymentIntent.status !== "succeeded") {
      const error = new Error("Stripe payment is not completed yet.");
      error.statusCode = 400;
      throw error;
    }

    if (paymentIntent.amount !== Math.round(totalAmount * 100)) {
      const error = new Error("Stripe payment amount does not match the order total.");
      error.statusCode = 400;
      throw error;
    }

    orderData.stripePaymentIntentId = paymentIntent.id;
  }

  await reserveOrderStock(items);

  let order;
  try {
    order = await Order.create(orderData);
  } catch (error) {
    await releaseOrderStock(items);
    throw error;
  }

  if (cart.couponCode) {
    await Coupon.findOneAndUpdate({ code: cart.couponCode }, { $inc: { usedCount: 1 } });
  }

  cart.items = [];
  cart.subtotal = 0;
  cart.discountAmount = 0;
  cart.total = 0;
  cart.couponCode = undefined;
  await cart.save();

  await sendEmail({
    to: user.email,
    subject: `Order confirmation - ${order.orderNumber}`,
    html: `<p>Your order <strong>${order.orderNumber}</strong> has been placed successfully.</p>`,
  });

  res.status(201).json({
    success: true,
    message: "Order placed successfully.",
    data: order,
  });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate("userId", "firstName lastName email");

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  const isOwner = order.userId._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    const error = new Error("You do not have permission to cancel this order.");
    error.statusCode = 403;
    throw error;
  }

  const updatedOrder = await cancelOrderRecord(order, {
    actor: req.user.role === "admin" ? "admin" : "customer",
    reason: req.validated?.body?.cancellationReason || "",
  });

  await sendEmail({
    to: updatedOrder.userId.email,
    subject: `Order cancelled - ${updatedOrder.orderNumber}`,
    html: `<p>Your order <strong>${updatedOrder.orderNumber}</strong> has been cancelled.</p><p>${
      updatedOrder.paymentStatus === "refunded"
        ? "Your Stripe payment refund has been initiated."
        : "If no online payment was captured, no refund was needed."
    }</p>`,
  });

  res.json({
    success: true,
    message: getCancellationSuccessMessage(updatedOrder),
    data: updatedOrder,
  });
});

const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: orders,
  });
});

const requestOrderReturn = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate("userId", "firstName lastName email");

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  if (order.userId._id.toString() !== req.user._id.toString()) {
    const error = new Error("You do not have permission to request a return for this order.");
    error.statusCode = 403;
    throw error;
  }

  if (!canRequestReturn(order)) {
    const error = new Error("Return can only be requested after delivery and only once per order unless the previous request was rejected.");
    error.statusCode = 400;
    throw error;
  }

  const refundAccount = {
    accountHolderName: req.validated.body.refundAccountHolderName?.trim() || "",
    bankName: req.validated.body.refundBankName?.trim() || "",
    accountNumber: req.validated.body.refundAccountNumber?.trim() || "",
    iban: req.validated.body.refundIban?.trim() || "",
  };

  if (order.paymentMethod === "cod") {
    if (!refundAccount.accountHolderName || !refundAccount.bankName || !refundAccount.accountNumber) {
      const error = new Error("For COD returns, account holder name, bank name, and account number are required so admin can send the refund.");
      error.statusCode = 400;
      throw error;
    }
  }

  order.returnStatus = "requested";
  order.returnReason = req.validated.body.returnReason;
  order.returnDetails = req.validated.body.returnDetails || undefined;
  order.returnRefundAccount =
    refundAccount.accountHolderName || refundAccount.bankName || refundAccount.accountNumber || refundAccount.iban
      ? refundAccount
      : {};
  order.returnRequestedAt = new Date();
  order.returnApprovedAt = null;
  order.returnCompletedAt = null;
  order.returnResolutionNote = undefined;
  await order.save();

  res.json({
    success: true,
    message: "Return request submitted successfully.",
    data: order,
  });
});

const listAllOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find({})
    .populate("userId", "firstName lastName email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: orders,
  });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate("userId", "firstName lastName email");

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  const isOwner = order.userId._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    const error = new Error("You do not have permission to view this order.");
    error.statusCode = 403;
    throw error;
  }

  res.json({
    success: true,
    data: order,
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const updates = req.validated.body;
  const order = await Order.findById(req.params.orderId).populate("userId", "firstName lastName email");

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  if (updates.orderStatus === "cancelled") {
    const updatedOrder = await cancelOrderRecord(order, {
      actor: "admin",
      reason: updates.cancellationReason || "",
    });

    await sendEmail({
      to: updatedOrder.userId.email,
      subject: `Order cancelled - ${updatedOrder.orderNumber}`,
      html: `<p>Your order <strong>${updatedOrder.orderNumber}</strong> has been cancelled by admin.</p><p>${
        updatedOrder.paymentStatus === "refunded"
          ? "Your Stripe payment refund has been initiated."
          : "If no online payment was captured, no refund was needed."
      }</p>`,
    });

    res.json({
      success: true,
      message: getCancellationSuccessMessage(updatedOrder),
      data: updatedOrder,
    });
    return;
  }

  if (order.orderStatus === "cancelled") {
    const error = new Error("Cancelled orders cannot be updated.");
    error.statusCode = 400;
    throw error;
  }

  if (order.orderStatus === "delivered" && updates.orderStatus !== "delivered") {
    const error = new Error("Delivered orders cannot be moved back to another status.");
    error.statusCode = 400;
    throw error;
  }

  order.orderStatus = updates.orderStatus;
  if (updates.paymentStatus) {
    order.paymentStatus = updates.paymentStatus;
  }
  syncOrderShippingStatus(order, updates.orderStatus);
  recognizeRevenueIfEligible(order);
  await order.save();

  res.json({
    success: true,
    message: "Order updated successfully.",
    data: order,
  });
});

const updateOrderShipping = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate("userId", "firstName lastName email");

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  const updates = req.validated.body;
  if (updates.shippingStatus) {
    order.shippingStatus = updates.shippingStatus;
  }
  if (typeof updates.trackingNumber === "string") {
    order.trackingNumber = updates.trackingNumber.trim() || undefined;
  }
  if (typeof updates.shipmentReference === "string") {
    order.shipmentReference = updates.shipmentReference.trim() || undefined;
  }
  if (typeof updates.shipmentLabelUrl === "string") {
    order.shipmentLabelUrl = updates.shipmentLabelUrl.trim() || undefined;
  }
  if (typeof updates.notes === "string") {
    order.notes = updates.notes.trim() || undefined;
  }

  if (order.shippingStatus === "delivered") {
    order.orderStatus = "delivered";
    recognizeRevenueIfEligible(order);
  }

  await order.save();

  res.json({
    success: true,
    message: "Shipping details updated successfully.",
    data: order,
  });
});

const updateReturnStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate("userId", "firstName lastName email");

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  if (order.returnStatus === "none") {
    const error = new Error("This order does not have an active return request.");
    error.statusCode = 400;
    throw error;
  }

  const { returnStatus, returnResolutionNote } = req.validated.body;
  order.returnStatus = returnStatus;
  if (typeof returnResolutionNote === "string") {
    order.returnResolutionNote = returnResolutionNote.trim() || undefined;
  }

  if (returnStatus === "approved") {
    order.returnApprovedAt = new Date();
    if (!order.returnTrackingNumber) {
      try {
        const shipment = await createAramexReturnShipment({ order });
        order.returnTrackingNumber = shipment.trackingNumber;
        order.returnShipmentReference = shipment.shipmentReference;
        order.returnShipmentLabelUrl = shipment.labelUrl;
        order.returnShippingMeta = shipment.raw;
        order.shippingStatus = "return_in_transit";
      } catch {
        // Keep approval flow working even if Aramex return creation fails.
      }
    }
  }

  if (returnStatus === "in_transit") {
    order.shippingStatus = "return_in_transit";
  }

  if (["received", "refunded", "completed"].includes(returnStatus)) {
    await restoreReturnedStockIfNeeded(order);
    order.shippingStatus = "returned";
  }

  if (["refunded", "completed"].includes(returnStatus)) {
    if (order.paymentMethod === "stripe" && order.paymentStatus === "paid") {
      order.paymentStatus = await refundStripeOrderIfNeeded(order);
    } else if (order.paymentStatus !== "refunded") {
      order.paymentStatus = "refunded";
    }
    if (order.revenueRecognizedAt && !order.revenueCancelledAt) {
      order.revenueCancelledAt = new Date();
    }
    order.returnCompletedAt = new Date();
  }

  await order.save();

  res.json({
    success: true,
    message: "Return status updated successfully.",
    data: order,
  });
});

export {
  buildOrderDraft,
  cancelOrder,
  createOrder,
  createStripePaymentIntent,
  listMyOrders,
  listAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderShipping,
  requestOrderReturn,
  updateReturnStatus,
};
