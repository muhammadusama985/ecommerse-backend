import { z } from "zod";

const variantSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1),
  optionValues: z.array(z.string()).optional(),
  price: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
});

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string(),
    images: z.array(z.string()).optional(),
    price: z.number().nonnegative(),
    compareAtPrice: z.number().nonnegative().optional(),
    stock: z.number().int().nonnegative().optional(),
    isFeatured: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    badge: z.string().optional(),
    tags: z.array(z.string()).optional(),
    variants: z.array(variantSchema).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    images: z.array(z.string()).optional(),
    price: z.number().nonnegative().optional(),
    compareAtPrice: z.number().nonnegative().optional(),
    stock: z.number().int().nonnegative().optional(),
    isFeatured: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    badge: z.string().optional(),
    tags: z.array(z.string()).optional(),
    variants: z.array(variantSchema).optional(),
  }),
  params: z.object({
    productId: z.string(),
  }),
  query: z.object({}).optional(),
});

export { createProductSchema, updateProductSchema };
