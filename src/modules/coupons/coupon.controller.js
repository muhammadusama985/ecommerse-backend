import { Coupon } from "../../models/coupon.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { findValidCouponByCode } from "../../services/coupon.service.js";

const listCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: coupons,
  });
});

const createCoupon = asyncHandler(async (req, res) => {
  const payload = req.validated.body;

  const existingCoupon = await Coupon.findOne({ code: payload.code.toUpperCase().trim() });
  if (existingCoupon) {
    const error = new Error("Coupon code already exists.");
    error.statusCode = 409;
    throw error;
  }

  const coupon = await Coupon.create({
    ...payload,
    code: payload.code.toUpperCase().trim(),
  });

  res.status(201).json({
    success: true,
    message: "Coupon created successfully.",
    data: coupon,
  });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.couponId, req.validated.body, {
    new: true,
    runValidators: true,
  });

  if (!coupon) {
    const error = new Error("Coupon not found.");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    message: "Coupon updated successfully.",
    data: coupon,
  });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.couponId);

  if (!coupon) {
    const error = new Error("Coupon not found.");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    message: "Coupon deleted successfully.",
  });
});

const validateCouponCode = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.validated.body;
  const result = await findValidCouponByCode({ code, subtotal });

  if (!result) {
    const error = new Error("Coupon is invalid or not applicable.");
    error.statusCode = 400;
    throw error;
  }

  res.json({
    success: true,
    data: {
      couponId: result.coupon._id,
      code: result.coupon.code,
      discountAmount: result.discountAmount,
    },
  });
});

export { listCoupons, createCoupon, updateCoupon, deleteCoupon, validateCouponCode };
