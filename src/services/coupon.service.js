import { Coupon } from "../models/coupon.model.js";

const resolveCouponDiscount = ({ coupon, subtotal }) => {
  if (!coupon || !coupon.isActive) {
    return 0;
  }

  if (coupon.startsAt && coupon.startsAt > new Date()) {
    return 0;
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return 0;
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return 0;
  }

  if (subtotal < coupon.minimumOrderAmount) {
    return 0;
  }

  if (coupon.discountType === "percentage") {
    return Math.min(subtotal, Number(((subtotal * coupon.discountValue) / 100).toFixed(2)));
  }

  return Math.min(subtotal, coupon.discountValue);
};

const findValidCouponByCode = async ({ code, subtotal }) => {
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

  if (!coupon) {
    return null;
  }

  const discountAmount = resolveCouponDiscount({ coupon, subtotal });
  if (!discountAmount) {
    return null;
  }

  return { coupon, discountAmount };
};

export { resolveCouponDiscount, findValidCouponByCode };
