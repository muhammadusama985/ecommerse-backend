import { z } from "zod";

const createOrderSchema = z.object({
  body: z.object({
    addressId: z.string(),
    paymentMethod: z.enum(["cod", "stripe"]),
    paymentIntentId: z.string().optional(),
    notes: z.string().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const createPaymentIntentSchema = z.object({
  body: z.object({
    addressId: z.string(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    orderStatus: z.enum(["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
    paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
    cancellationReason: z.string().trim().max(500).optional(),
  }),
  params: z.object({
    orderId: z.string(),
  }),
  query: z.object({}).optional(),
});

const updateOrderShippingSchema = z.object({
  body: z.object({
    shippingStatus: z.enum(["pending", "quoted", "shipment_created", "in_transit", "delivered", "exception", "return_in_transit", "returned"]).optional(),
    trackingNumber: z.string().trim().max(200).optional(),
    shipmentReference: z.string().trim().max(200).optional(),
    shipmentLabelUrl: z.string().trim().max(1000).optional(),
    notes: z.string().trim().max(1000).optional(),
  }),
  params: z.object({
    orderId: z.string(),
  }),
  query: z.object({}).optional(),
});

const cancelOrderSchema = z.object({
  body: z.object({
    cancellationReason: z.string().trim().max(500).optional(),
  }).optional(),
  params: z.object({
    orderId: z.string(),
  }),
  query: z.object({}).optional(),
});

const requestReturnSchema = z.object({
  body: z.object({
    returnReason: z.string().trim().min(3).max(300),
    returnDetails: z.string().trim().max(1000).optional(),
    refundAccountHolderName: z.string().trim().max(200).optional(),
    refundBankName: z.string().trim().max(200).optional(),
    refundAccountNumber: z.string().trim().max(200).optional(),
    refundIban: z.string().trim().max(200).optional(),
  }),
  params: z.object({
    orderId: z.string(),
  }),
  query: z.object({}).optional(),
});

const updateReturnStatusSchema = z.object({
  body: z.object({
    returnStatus: z.enum(["approved", "rejected", "in_transit", "received", "refunded", "completed"]),
    returnResolutionNote: z.string().trim().max(1000).optional(),
  }),
  params: z.object({
    orderId: z.string(),
  }),
  query: z.object({}).optional(),
});

export {
  createOrderSchema,
  createPaymentIntentSchema,
  updateOrderStatusSchema,
  updateOrderShippingSchema,
  cancelOrderSchema,
  requestReturnSchema,
  updateReturnStatusSchema,
};
