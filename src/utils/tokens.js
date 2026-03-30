import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const createAccessToken = (userId) =>
  jwt.sign({ sub: userId }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  });

const createRefreshToken = (userId) =>
  jwt.sign({ sub: userId }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });

export { createAccessToken, createRefreshToken };
