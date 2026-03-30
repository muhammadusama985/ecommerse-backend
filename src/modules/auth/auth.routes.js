import { Router } from "express";
import { forgotPassword, login, me, refreshSession, register, resetPassword, socialLogin } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/auth.js";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
  socialLoginSchema,
} from "../../validators/auth.validators.js";

const authRouter = Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/social", validate(socialLoginSchema), socialLogin);
authRouter.post("/refresh", validate(refreshTokenSchema), refreshSession);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
authRouter.post("/reset-password", validate(resetPasswordSchema), resetPassword);
authRouter.get("/me", authenticate, me);

export { authRouter };
