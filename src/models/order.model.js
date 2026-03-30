import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
    name: { type: String, required: true, trim: true },
    image: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: true },
);

const orderAddressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    area: { type: String, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    postalCode: { type: String, trim: true },
  },
  { _id: false },
);

const returnRefundAccountSchema = new mongoose.Schema(
  {
    accountHolderName: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    iban: { type: String, trim: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    shippingAddress: { type: orderAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingAmount: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, trim: true, uppercase: true },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "AED", trim: true },
    shippingProvider: { type: String, default: "aramex", trim: true },
    trackingNumber: { type: String, trim: true },
    shipmentReference: { type: String, trim: true },
    shipmentLabelUrl: { type: String, trim: true },
    returnTrackingNumber: { type: String, trim: true },
    returnShipmentReference: { type: String, trim: true },
    returnShipmentLabelUrl: { type: String, trim: true },
    shippingStatus: {
      type: String,
      enum: ["pending", "quoted", "shipment_created", "in_transit", "delivered", "exception", "return_in_transit", "returned"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "stripe"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed",
    },
    stripePaymentIntentId: { type: String, trim: true },
    shippingMeta: { type: mongoose.Schema.Types.Mixed, default: {} },
    returnShippingMeta: { type: mongoose.Schema.Types.Mixed, default: {} },
    cancelledBy: {
      type: String,
      enum: ["customer", "admin"],
      trim: true,
    },
    returnStatus: {
      type: String,
      enum: ["none", "requested", "approved", "rejected", "in_transit", "received", "refunded", "completed"],
      default: "none",
    },
    returnReason: { type: String, trim: true },
    returnDetails: { type: String, trim: true },
    returnRequestedAt: { type: Date, default: null },
    returnApprovedAt: { type: Date, default: null },
    returnCompletedAt: { type: Date, default: null },
    returnRestockedAt: { type: Date, default: null },
    returnResolutionNote: { type: String, trim: true },
    returnRefundAccount: { type: returnRefundAccountSchema, default: {} },
    revenueRecognizedAt: { type: Date, default: null },
    revenueCancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);

export { Order };
