import { Cart } from "../../models/cart.model.js";
import { Product } from "../../models/product.model.js";
import { assertProductStock } from "../../services/inventory.service.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { findValidCouponByCode } from "../../services/coupon.service.js";

const calculateCartSubtotal = (items) =>
  items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

const applyCartTotals = async (cart) => {
  cart.subtotal = calculateCartSubtotal(cart.items);
  cart.discountAmount = 0;

  if (cart.couponCode) {
    const result = await findValidCouponByCode({
      code: cart.couponCode,
      subtotal: cart.subtotal,
    });

    if (result) {
      cart.discountAmount = result.discountAmount;
      cart.couponCode = result.coupon.code;
    } else {
      cart.couponCode = undefined;
    }
  }

  cart.total = Math.max(0, Number((cart.subtotal - cart.discountAmount).toFixed(2)));
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId }).populate("items.productId");

  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
    cart = await Cart.findOne({ userId }).populate("items.productId");
  }

  return cart;
};

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await applyCartTotals(cart);
  await cart.save();

  res.json({
    success: true,
    data: cart,
  });
});

const addCartItem = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity } = req.validated.body;
  const { product } = await assertProductStock(productId, quantity, variantId);

  const cart = await getOrCreateCart(req.user._id);
  const existingItem = cart.items.find(
    (item) =>
      item.productId._id.toString() === productId &&
      (item.variantId?.toString() || "") === (variantId || ""),
  );

  if (existingItem) {
    const nextQuantity = existingItem.quantity + quantity;
    await assertProductStock(productId, nextQuantity, variantId);
    existingItem.quantity = nextQuantity;
  } else {
    cart.items.push({
      productId: product._id,
      variantId: variantId || null,
      quantity,
      unitPrice: product.price,
    });
  }

  await applyCartTotals(cart);
  await cart.save();
  await cart.populate("items.productId");

  res.status(201).json({
    success: true,
    message: "Item added to cart.",
    data: cart,
  });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.validated.body;
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);

  if (!item) {
    const error = new Error("Cart item not found.");
    error.statusCode = 404;
    throw error;
  }

  await assertProductStock(item.productId._id || item.productId, quantity, item.variantId);
  item.quantity = quantity;
  await applyCartTotals(cart);
  await cart.save();
  await cart.populate("items.productId");

  res.json({
    success: true,
    message: "Cart item updated.",
    data: cart,
  });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);

  if (!item) {
    const error = new Error("Cart item not found.");
    error.statusCode = 404;
    throw error;
  }

  item.deleteOne();
  await applyCartTotals(cart);
  await cart.save();
  await cart.populate("items.productId");

  res.json({
    success: true,
    message: "Cart item removed.",
    data: cart,
  });
});

const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  cart.subtotal = 0;
  cart.discountAmount = 0;
  cart.total = 0;
  cart.couponCode = undefined;
  await cart.save();

  res.json({
    success: true,
    message: "Cart cleared successfully.",
    data: cart,
  });
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.validated.body;
  const cart = await getOrCreateCart(req.user._id);

  if (Number(cart.subtotal.toFixed(2)) !== Number(subtotal.toFixed(2))) {
    await applyCartTotals(cart);
  }

  const result = await findValidCouponByCode({ code, subtotal: cart.subtotal });
  if (!result) {
    const error = new Error("Coupon is invalid or not applicable.");
    error.statusCode = 400;
    throw error;
  }

  cart.couponCode = result.coupon.code;
  await applyCartTotals(cart);
  await cart.save();
  await cart.populate("items.productId");

  res.json({
    success: true,
    message: "Coupon applied successfully.",
    data: cart,
  });
});

const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.couponCode = undefined;
  await applyCartTotals(cart);
  await cart.save();
  await cart.populate("items.productId");

  res.json({
    success: true,
    message: "Coupon removed successfully.",
    data: cart,
  });
});

export {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  getOrCreateCart,
  applyCartTotals,
};
