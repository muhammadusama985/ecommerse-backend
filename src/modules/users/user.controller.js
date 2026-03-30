import { User } from "../../models/user.model.js";
import { Product } from "../../models/product.model.js";
import { asyncHandler } from "../../utils/async-handler.js";

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const updates = req.validated.body;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  res.json({
    success: true,
    message: "Profile updated successfully.",
    data: user,
  });
});

const addAddress = asyncHandler(async (req, res) => {
  const address = req.validated.body;
  const user = await User.findById(req.user._id);

  if (address.isDefault) {
    user.addresses.forEach((item) => {
      item.isDefault = false;
    });
  }

  if (!user.addresses.length) {
    address.isDefault = true;
  }

  user.addresses.push(address);
  await user.save();

  res.status(201).json({
    success: true,
    message: "Address added successfully.",
    data: user.addresses,
  });
});

const removeAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    const error = new Error("Address not found.");
    error.statusCode = 404;
    throw error;
  }

  const wasDefault = address.isDefault;
  address.deleteOne();

  if (wasDefault && user.addresses.length) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.json({
    success: true,
    message: "Address removed successfully.",
    data: user.addresses,
  });
});

const listWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist");

  res.json({
    success: true,
    data: user.wishlist,
  });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const user = await User.findById(req.user._id);

  if (!user.wishlist.some((id) => id.toString() === productId)) {
    user.wishlist.push(productId);
    await user.save();
  }

  await user.populate("wishlist");

  res.json({
    success: true,
    message: "Product added to wishlist.",
    data: user.wishlist,
  });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);

  user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
  await user.save();
  await user.populate("wishlist");

  res.json({
    success: true,
    message: "Product removed from wishlist.",
    data: user.wishlist,
  });
});

export {
  getProfile,
  updateProfile,
  addAddress,
  removeAddress,
  listWishlist,
  addToWishlist,
  removeFromWishlist,
};
