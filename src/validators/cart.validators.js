import { z } from "zod";

const addCartItemSchema = z.object({
  body: z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1).default(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().min(1),
  }),
  params: z.object({
    itemId: z.string(),
  }),
  query: z.object({}).optional(),
});

const cartItemIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    itemId: z.string(),
  }),
  query: z.object({}).optional(),
});

export { addCartItemSchema, updateCartItemSchema, cartItemIdSchema };
