import { z } from "zod";

const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    phone: z.string().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    portal: z.enum(["customer", "admin"]).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const socialLoginSchema = z.object({
  body: z.object({
    provider: z.enum(["google", "facebook", "apple"]),
    token: z.string().min(10),
    portal: z.enum(["customer", "admin"]).optional(),
    profile: z
      .object({
        email: z.string().email().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      })
      .optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10),
    password: z.string().min(8),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
    portal: z.enum(["customer", "admin"]).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export { registerSchema, loginSchema, socialLoginSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema };
