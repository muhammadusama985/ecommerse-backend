import Stripe from "stripe";
import { env } from "../config/env.js";

const stripe = env.stripeSecretKey ? new Stripe(env.stripeSecretKey) : null;

export { stripe };
