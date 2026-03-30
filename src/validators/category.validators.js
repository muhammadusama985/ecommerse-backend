import { z } from "zod";

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    parentId: z.string().optional(),
    image: z.string().optional(),
    sortOrder: z.number().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
    image: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    categoryId: z.string(),
  }),
  query: z.object({}).optional(),
});

export { createCategorySchema, updateCategorySchema };
