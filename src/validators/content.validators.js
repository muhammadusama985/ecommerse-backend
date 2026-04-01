import { z } from "zod";

const createBlogPostSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    excerpt: z.string().optional(),
    content: z.string().min(10),
    coverImage: z.string().optional(),
    isPublished: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateBlogPostSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    excerpt: z.string().optional(),
    content: z.string().min(10).optional(),
    coverImage: z.string().optional(),
    isPublished: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }),
  params: z.object({
    postId: z.string(),
  }),
  query: z.object({}).optional(),
});

const createPageSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    content: z.string().min(10),
    metaDescription: z.string().optional(),
    isPublished: z.boolean().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updatePageSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    content: z.string().min(10).optional(),
    metaDescription: z.string().optional(),
    isPublished: z.boolean().optional(),
  }),
  params: z.object({
    pageId: z.string(),
  }),
  query: z.object({}).optional(),
});

const createBannerSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    ctaLabel: z.string().optional(),
    ctaHref: z.string().optional(),
    placement: z.enum(["hero", "promo", "category", "footer"]).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const updateBannerSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    ctaLabel: z.string().optional(),
    ctaHref: z.string().optional(),
    placement: z.enum(["hero", "promo", "category", "footer"]).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().optional(),
  }),
  params: z.object({
    bannerId: z.string(),
  }),
  query: z.object({}).optional(),
});

const updateSettingSchema = z.object({
  body: z.object({
    value: z.any(),
  }),
  params: z.object({
    key: z.string().min(2),
  }),
  query: z.object({}).optional(),
});

export {
  createBlogPostSchema,
  updateBlogPostSchema,
  createPageSchema,
  updatePageSchema,
  createBannerSchema,
  updateBannerSchema,
  updateSettingSchema,
};
