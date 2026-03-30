import { z } from "zod";

const createReviewSchema = z.object({
  body: z.object({
    productId: z.string(),
    rating: z.number().min(1).max(5),
    title: z.string().optional(),
    comment: z.string().min(3),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateReviewByAdminSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5),
    title: z.string().optional(),
    comment: z.string().min(3),
    isApproved: z.boolean().optional(),
  }),
  params: z.object({
    reviewId: z.string(),
  }),
  query: z.object({}).optional(),
});

export { createReviewSchema, updateReviewByAdminSchema };
