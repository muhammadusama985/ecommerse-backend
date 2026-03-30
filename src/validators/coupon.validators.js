import { z } from "zod";

const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3),
    description: z.string().optional(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().positive(),
    minimumOrderAmount: z.number().nonnegative().optional(),
    usageLimit: z.number().int().nonnegative().optional(),
    startsAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateCouponSchema = z.object({
  body: z.object({
    description: z.string().optional(),
    discountType: z.enum(["percentage", "fixed"]).optional(),
    discountValue: z.number().positive().optional(),
    minimumOrderAmount: z.number().nonnegative().optional(),
    usageLimit: z.number().int().nonnegative().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    couponId: z.string(),
  }),
  query: z.object({}).optional(),
});

const validateCouponCodeSchema = z.object({
  body: z.object({
    code: z.string().min(3),
    subtotal: z.number().nonnegative(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export { createCouponSchema, updateCouponSchema, validateCouponCodeSchema };
