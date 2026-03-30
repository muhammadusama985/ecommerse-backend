import mongoose from "mongoose";
import { env } from "./env.js";

const connectDatabase = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongodbUri);
  console.log("MongoDB connected");
};

export { connectDatabase };
