import { Category } from "../../models/category.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { slugify } from "../../utils/slugify.js";

const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });

  res.json({
    success: true,
    data: categories,
  });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parentId, image, sortOrder } = req.validated.body;

  const category = await Category.create({
    name,
    slug: slugify(name),
    description,
    parentId: parentId || null,
    image,
    sortOrder: sortOrder || 0,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully.",
    data: category,
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  if (payload.name) {
    payload.slug = slugify(payload.name);
  }

  const category = await Category.findByIdAndUpdate(req.params.categoryId, payload, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    const error = new Error("Category not found.");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    message: "Category updated successfully.",
    data: category,
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.categoryId);
  if (!category) {
    const error = new Error("Category not found.");
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    message: "Category deleted successfully.",
  });
});

export { listCategories, createCategory, updateCategory, deleteCategory };
