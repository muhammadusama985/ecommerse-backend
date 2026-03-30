import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  STRIPE_SECRET_KEY: z.string().default(""),
  GOOGLE_TRANSLATE_API_KEY: z.string().default(""),
  GOOGLE_CLIENT_ID: z.string().default(""),
  FACEBOOK_APP_ID: z.string().default(""),
  FACEBOOK_APP_SECRET: z.string().default(""),
  APPLE_CLIENT_ID: z.string().default(""),
  ARAMEX_BASE_URL: z.string().default("https://ws.dev.aramex.net"),
  ARAMEX_USERNAME: z.string().default(""),
  ARAMEX_PASSWORD: z.string().default(""),
  ARAMEX_ACCOUNT_NUMBER: z.string().default(""),
  ARAMEX_ACCOUNT_PIN: z.string().default(""),
  ARAMEX_ACCOUNT_ENTITY: z.string().default(""),
  ARAMEX_ACCOUNT_COUNTRY_CODE: z.string().default(""),
  ARAMEX_SHIPPER_NAME: z.string().default("Nature Republic"),
  ARAMEX_SHIPPER_COMPANY: z.string().default("Nature Republic"),
  ARAMEX_SHIPPER_PHONE: z.string().default(""),
  ARAMEX_SHIPPER_EMAIL: z.string().default(""),
  ARAMEX_SHIPPER_ADDRESS_LINE1: z.string().default(""),
  ARAMEX_SHIPPER_CITY: z.string().default(""),
  ARAMEX_SHIPPER_COUNTRY_CODE: z.string().default("AE"),
  ARAMEX_SHIPPER_POSTAL_CODE: z.string().default(""),
  EMAIL_FROM: z.string().default("no-reply@example.com"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.flatten().fieldErrors);
  throw new Error("Environment validation failed.");
}

const env = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  clientUrl: parsedEnv.data.CLIENT_URL,
  mongodbUri: parsedEnv.data.MONGODB_URI,
  jwtAccessSecret: parsedEnv.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsedEnv.data.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: parsedEnv.data.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: parsedEnv.data.JWT_REFRESH_EXPIRES_IN,
  stripeSecretKey: parsedEnv.data.STRIPE_SECRET_KEY,
  googleTranslateApiKey: parsedEnv.data.GOOGLE_TRANSLATE_API_KEY,
  googleClientId: parsedEnv.data.GOOGLE_CLIENT_ID,
  facebookAppId: parsedEnv.data.FACEBOOK_APP_ID,
  facebookAppSecret: parsedEnv.data.FACEBOOK_APP_SECRET,
  appleClientId: parsedEnv.data.APPLE_CLIENT_ID,
  aramexBaseUrl: parsedEnv.data.ARAMEX_BASE_URL,
  aramexUsername: parsedEnv.data.ARAMEX_USERNAME,
  aramexPassword: parsedEnv.data.ARAMEX_PASSWORD,
  aramexAccountNumber: parsedEnv.data.ARAMEX_ACCOUNT_NUMBER,
  aramexAccountPin: parsedEnv.data.ARAMEX_ACCOUNT_PIN,
  aramexAccountEntity: parsedEnv.data.ARAMEX_ACCOUNT_ENTITY,
  aramexAccountCountryCode: parsedEnv.data.ARAMEX_ACCOUNT_COUNTRY_CODE,
  aramexShipperName: parsedEnv.data.ARAMEX_SHIPPER_NAME,
  aramexShipperCompany: parsedEnv.data.ARAMEX_SHIPPER_COMPANY,
  aramexShipperPhone: parsedEnv.data.ARAMEX_SHIPPER_PHONE,
  aramexShipperEmail: parsedEnv.data.ARAMEX_SHIPPER_EMAIL,
  aramexShipperAddressLine1: parsedEnv.data.ARAMEX_SHIPPER_ADDRESS_LINE1,
  aramexShipperCity: parsedEnv.data.ARAMEX_SHIPPER_CITY,
  aramexShipperCountryCode: parsedEnv.data.ARAMEX_SHIPPER_COUNTRY_CODE,
  aramexShipperPostalCode: parsedEnv.data.ARAMEX_SHIPPER_POSTAL_CODE,
  emailFrom: parsedEnv.data.EMAIL_FROM,
  smtpHost: parsedEnv.data.SMTP_HOST,
  smtpPort: parsedEnv.data.SMTP_PORT,
  smtpUser: parsedEnv.data.SMTP_USER,
  smtpPass: parsedEnv.data.SMTP_PASS,
};

const allowedClientOrigins = env.clientUrl
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

env.allowedClientOrigins = allowedClientOrigins.length ? allowedClientOrigins : ["http://localhost:5173", "http://localhost:5174"];

export { env };
