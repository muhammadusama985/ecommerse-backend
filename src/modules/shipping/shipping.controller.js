import { Order } from "../../models/order.model.js";
import {
  calculateAramexRate,
  createAramexShipment,
  createAramexReturnShipment,
  isAramexConfigured,
  trackAramexShipment,
} from "../../services/aramex.service.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { buildOrderDraft } from "../orders/order.controller.js";

const getAramexRate = asyncHandler(async (req, res) => {
  const { addressId } = req.validated.body;
  const draft = await buildOrderDraft(req.user._id, addressId);
  const quote = await calculateAramexRate({
    address: draft.address,
    items: draft.items,
  });

  res.json({
    success: true,
    data: quote,
  });
});

const createOrderShipment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  const shipment = await createAramexShipment({ order });

  order.trackingNumber = shipment.trackingNumber;
  order.shipmentReference = shipment.shipmentReference;
  order.shipmentLabelUrl = shipment.labelUrl;
  order.shippingStatus = "shipment_created";
  order.shippingMeta = shipment.raw;
  await order.save();
  await order.populate("userId", "firstName lastName email");

  res.json({
    success: true,
    message: "Aramex shipment created successfully.",
    data: order,
  });
});

const createOrderReturnShipment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!["requested", "approved", "in_transit"].includes(order.returnStatus)) {
    const error = new Error("Return shipment can only be created for requested or approved returns.");
    error.statusCode = 400;
    throw error;
  }

  const shipment = await createAramexReturnShipment({ order });

  order.returnTrackingNumber = shipment.trackingNumber;
  order.returnShipmentReference = shipment.shipmentReference;
  order.returnShipmentLabelUrl = shipment.labelUrl;
  order.shippingStatus = "return_in_transit";
  if (order.returnStatus === "requested") {
    order.returnStatus = "approved";
    order.returnApprovedAt = new Date();
  }
  order.returnShippingMeta = shipment.raw;
  await order.save();
  await order.populate("userId", "firstName lastName email");

  res.json({
    success: true,
    message: "Aramex return shipment created successfully.",
    data: order,
  });
});

const trackOrderShipment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!order.trackingNumber) {
    const error = new Error("Tracking number is not available for this order yet.");
    error.statusCode = 400;
    throw error;
  }

  const tracking = await trackAramexShipment({ trackingNumber: order.trackingNumber });
  const updates = tracking.TrackingResults?.[0]?.Value?.slice(-1)?.[0];

  if (updates?.UpdateDescription) {
    const normalized = updates.UpdateDescription.toLowerCase();
    if (normalized.includes("delivered")) {
      order.shippingStatus = "delivered";
    } else if (normalized.includes("transit") || normalized.includes("shipment")) {
      order.shippingStatus = "in_transit";
    }
  }

  order.shippingMeta = {
    ...(order.shippingMeta || {}),
    tracking,
  };
  await order.save();
  await order.populate("userId", "firstName lastName email");

  res.json({
    success: true,
    data: {
      order,
      tracking,
    },
  });
});

const trackOrderReturnShipment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    const error = new Error("Order not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!order.returnTrackingNumber) {
    const error = new Error("Return tracking number is not available for this order yet.");
    error.statusCode = 400;
    throw error;
  }

  const tracking = await trackAramexShipment({ trackingNumber: order.returnTrackingNumber });
  const updates = tracking.TrackingResults?.[0]?.Value?.slice(-1)?.[0];

  if (updates?.UpdateDescription) {
    const normalized = updates.UpdateDescription.toLowerCase();
    if (normalized.includes("delivered") || normalized.includes("received")) {
      order.shippingStatus = "returned";
      if (["approved", "in_transit", "requested"].includes(order.returnStatus)) {
        order.returnStatus = "received";
      }
    } else if (normalized.includes("transit") || normalized.includes("shipment")) {
      order.shippingStatus = "return_in_transit";
      if (order.returnStatus === "approved" || order.returnStatus === "requested") {
        order.returnStatus = "in_transit";
      }
    }
  }

  order.returnShippingMeta = {
    ...(order.returnShippingMeta || {}),
    tracking,
  };
  await order.save();
  await order.populate("userId", "firstName lastName email");

  res.json({
    success: true,
    data: {
      order,
      tracking,
    },
  });
});

const getShippingConfigStatus = asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      provider: "aramex",
      configured: isAramexConfigured(),
    },
  });
});

export { getAramexRate, createOrderShipment, createOrderReturnShipment, trackOrderShipment, trackOrderReturnShipment, getShippingConfigStatus };
