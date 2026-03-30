import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../../models/user.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { createAccessToken, createRefreshToken } from "../../utils/tokens.js";
import { env } from "../../config/env.js";
import { sendEmail } from "../../services/email.service.js";
import { createRandomPassword, verifySocialLogin } from "../../services/social-auth.service.js";

const buildAuthResponse = (user) => {
  const accessToken = createAccessToken(user._id.toString());
  const refreshToken = createRefreshToken(user._id.toString());

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      wishlist: user.wishlist,
      addresses: user.addresses,
    },
  };
};

const assertPortalAccess = (user, portal = "customer") => {
  if (portal === "customer" && user.role === "admin") {
    const error = new Error("Admin accounts must use the admin login.");
    error.statusCode = 403;
    throw error;
  }

  if (portal === "admin" && user.role !== "admin") {
    const error = new Error("This account is not allowed to access the admin dashboard.");
    error.statusCode = 403;
    throw error;
  }
};

const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.validated.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error("An account with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    phone,
  });

  const payload = buildAuthResponse(user);

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    data: payload,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password, portal } = req.validated.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  assertPortalAccess(user, portal || "customer");

  const payload = buildAuthResponse(user);

  res.json({
    success: true,
    message: "Login successful.",
    data: payload,
  });
});

const socialLogin = asyncHandler(async (req, res) => {
  const { provider, token, profile, portal } = req.validated.body;
  const socialProfile = await verifySocialLogin({ provider, token, profile });

  if (!socialProfile.email) {
    const error = new Error("This social account did not provide an email address.");
    error.statusCode = 400;
    throw error;
  }

  const providerField = `${provider}Id`;
  let user = await User.findOne({
    $or: [{ email: socialProfile.email }, { [`socialProviders.${providerField}`]: socialProfile.providerId }],
  });

  if (!user) {
    user = await User.create({
      firstName: socialProfile.firstName || "Guest",
      lastName: socialProfile.lastName || "User",
      email: socialProfile.email,
      password: createRandomPassword(),
      avatar: socialProfile.avatar,
      socialProviders: {
        [providerField]: socialProfile.providerId,
      },
    });
  } else {
    user.firstName = user.firstName || socialProfile.firstName || "Guest";
    user.lastName = user.lastName || socialProfile.lastName || "User";
    user.avatar = socialProfile.avatar || user.avatar;
    user.socialProviders = {
      ...(user.socialProviders || {}),
      [providerField]: socialProfile.providerId,
    };
    await user.save();
  }

  assertPortalAccess(user, portal || "customer");

  const payload = buildAuthResponse(user);

  res.json({
    success: true,
    message: "Social login successful.",
    data: payload,
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

const refreshSession = asyncHandler(async (req, res) => {
  const { refreshToken, portal } = req.validated.body;

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch {
    const error = new Error("Session expired. Please login again.");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    const error = new Error("User not found for this session.");
    error.statusCode = 404;
    throw error;
  }

  assertPortalAccess(user, portal || "customer");

  res.json({
    success: true,
    message: "Session refreshed successfully.",
    data: buildAuthResponse(user),
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.validated.body;
  const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpiresAt");

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();

    const resetLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: `<p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    });
  }

  res.json({
    success: true,
    message: "If an account exists with that email, a reset link has been sent.",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.validated.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select("+password +resetPasswordToken +resetPasswordExpiresAt");

  if (!user) {
    const error = new Error("Reset token is invalid or expired.");
    error.statusCode = 400;
    throw error;
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  res.json({
    success: true,
    message: "Password reset successfully.",
  });
});

export { register, login, socialLogin, me, refreshSession, forgotPassword, resetPassword };
