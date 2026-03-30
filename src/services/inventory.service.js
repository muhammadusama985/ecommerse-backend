import { Product } from "../models/product.model.js";

async function getProductForOrderItem(item) {
  const product = await Product.findById(item.productId);

  if (!product || !product.isActive) {
    const error = new Error(`${item.name || "Product"} is unavailable.`);
    error.statusCode = 400;
    throw error;
  }

  return product;
}

function getVariant(product, variantId) {
  if (!variantId) {
    return null;
  }

  const variant = product.variants.id(variantId);
  if (!variant) {
    const error = new Error(`Selected variant is not available for ${product.name}.`);
    error.statusCode = 400;
    throw error;
  }

  return variant;
}

async function assertProductStock(productId, quantity, variantId = null) {
  const product = await Product.findById(productId);

  if (!product || !product.isActive) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const variant = getVariant(product, variantId);
  const availableStock = variant ? Number(variant.stock || 0) : Number(product.stock || 0);

  if (availableStock <= 0) {
    const error = new Error(`${product.name} is out of stock.`);
    error.statusCode = 400;
    throw error;
  }

  if (quantity > availableStock) {
    const error = new Error(`Only ${availableStock} units of ${product.name} are available.`);
    error.statusCode = 400;
    throw error;
  }

  return {
    product,
    variant,
    availableStock,
  };
}

async function reserveOrderStock(items) {
  for (const item of items) {
    const product = await getProductForOrderItem(item);
    const variant = getVariant(product, item.variantId);
    const availableStock = variant ? Number(variant.stock || 0) : Number(product.stock || 0);

    if (availableStock < item.quantity) {
      const error = new Error(`Insufficient stock for ${product.name}.`);
      error.statusCode = 400;
      throw error;
    }

    if (variant) {
      variant.stock = Math.max(0, Number(variant.stock || 0) - item.quantity);
    }

    product.stock = Math.max(0, Number(product.stock || 0) - item.quantity);
    product.soldCount = Number(product.soldCount || 0) + item.quantity;
    await product.save();
  }
}

async function releaseOrderStock(items) {
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      continue;
    }

    const variant = item.variantId ? product.variants.id(item.variantId) : null;
    if (variant) {
      variant.stock = Number(variant.stock || 0) + item.quantity;
    }

    product.stock = Number(product.stock || 0) + item.quantity;
    product.soldCount = Math.max(0, Number(product.soldCount || 0) - item.quantity);
    await product.save();
  }
}

export { assertProductStock, reserveOrderStock, releaseOrderStock };
