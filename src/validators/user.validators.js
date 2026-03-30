import { z } from "zod";

const addressSchema = z.object({
  label: z.string().optional(),
  fullName: z.string().min(2),
  phone: z.string().min(5),
  country: z.string().default("UAE"),
  city: z.string().min(2),
  area: z.string().optional(),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const addAddressSchema = z.object({
  body: addressSchema,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const addressIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    addressId: z.string(),
  }),
  query: z.object({}).optional(),
});

export { updateProfileSchema, addAddressSchema, addressIdSchema };
