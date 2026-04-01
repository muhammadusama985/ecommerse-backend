import mongoose from "mongoose";
import { Banner } from "../../models/banner.model.js";
import { BlogPost } from "../../models/blog-post.model.js";
import { connectDatabase } from "../../config/database.js";
import { Category } from "../../models/category.model.js";
import { Page } from "../../models/page.model.js";
import { Product } from "../../models/product.model.js";
import { Setting } from "../../models/setting.model.js";
import { User } from "../../models/user.model.js";
import { slugify } from "../../utils/slugify.js";

const categories = [
  { name: "Skincare", description: "Nourish your skin with premium products", sortOrder: 1 },
  { name: "Makeup", description: "Enhance your natural beauty", sortOrder: 2 },
  { name: "Haircare", description: "Beautiful hair starts with great care", sortOrder: 3 },
  { name: "Fragrances", description: "Signature scents for every occasion", sortOrder: 4 },
];

const products = [
  {
    name: "Hydrating Face Serum",
    price: 45.99,
    soldCount: 565,
    isFeatured: true,
    isBestSeller: true,
    badge: "Top 5",
    categoryName: "Skincare",
  },
  {
    name: "Matte Liquid Lipstick",
    price: 24.99,
    soldCount: 196,
    isFeatured: true,
    isBestSeller: true,
    badge: "Top 10",
    categoryName: "Makeup",
  },
  {
    name: "Nourishing Hair Mask",
    price: 32.5,
    soldCount: 949,
    isFeatured: true,
    isBestSeller: true,
    badge: "Top 5",
    categoryName: "Haircare",
  },
  {
    name: "Floral Eau de Parfum",
    price: 89.99,
    soldCount: 884,
    isFeatured: true,
    isBestSeller: true,
    badge: "Top 5",
    categoryName: "Fragrances",
  },
];

const pages = [
  {
    title: "About",
    content: "Nature Republic is a premium beauty destination focused on skincare, makeup, haircare, and fragrance.",
    metaDescription: "About Nature Republic beauty store.",
  },
  {
    title: "Contact",
    content: "Reach our customer support team for product help, order questions, and delivery support.",
    metaDescription: "Contact Nature Republic support.",
  },
];

const blogPosts = [
  {
    title: "5 Skincare Essentials For A Daily Glow",
    excerpt: "A simple beauty routine to keep your skin fresh and radiant.",
    content: "Start with a gentle cleanser, follow with a hydrating serum, then lock in moisture with a nourishing cream.",
  },
  {
    title: "How To Pick The Right Fragrance For Every Occasion",
    excerpt: "A quick guide to choosing signature scents.",
    content: "Fresh floral notes work well for daytime, while richer oud and musk profiles suit evening occasions.",
  },
];

const banners = [
  {
    title: "Discover Your Natural Beauty",
    subtitle: "Premium beauty products that enhance your natural glow.",
    description:
      "From skincare essentials to luxury makeup, find everything you need to feel confident and beautiful with Nature Republic.",
    ctaLabel: "Shop Now",
    ctaHref: "/best-sellers",
    placement: "hero",
    sortOrder: 1,
  },
  {
    title: "Free shipping on orders over AED 50",
    subtitle: "Use code BEAUTY20 for your first order",
    placement: "promo",
    sortOrder: 1,
  },
];

const settings = [
  { key: "promoBarText", value: "Free shipping on orders over AED 50 | Use code BEAUTY20 for your first order" },
  { key: "heroTitle", value: "Discover Your Natural Beauty" },
  {
    key: "heroSubtitle",
    value:
      "Premium beauty products that enhance your natural glow. From skincare essentials to luxury makeup, find everything you need to feel confident and beautiful.",
  },
  { key: "heroCtaLabel", value: "Shop Now" },
];

const seed = async () => {
  await connectDatabase();

  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Banner.deleteMany({}),
    BlogPost.deleteMany({}),
    Page.deleteMany({}),
    Setting.deleteMany({}),
    User.deleteMany({ email: { $in: ["admin@naturerepublic.com", "customer@naturerepublic.com"] } }),
  ]);

  const insertedCategories = await Category.insertMany(
    categories.map((category) => ({
      ...category,
      slug: slugify(category.name),
    })),
  );

  const categoryMap = new Map(insertedCategories.map((category) => [category.name, category._id]));

  await Product.insertMany(
    products.map((product) => ({
      name: product.name,
      slug: slugify(product.name),
      shortDescription: `${product.name} for everyday beauty routines.`,
      description: `${product.name} is part of the initial seeded catalog for the beauty storefront.`,
      categoryId: categoryMap.get(product.categoryName),
      images: [],
      price: product.price,
      stock: 100,
      soldCount: product.soldCount,
      isFeatured: product.isFeatured,
      isBestSeller: product.isBestSeller,
      badge: product.badge,
    })),
  );

  await User.create({
    firstName: "Admin",
    lastName: "User",
    email: "admin@naturerepublic.com",
    password: "Admin123!",
    role: "admin",
  });

  await User.create({
    firstName: "Test",
    lastName: "Customer",
    email: "customer@naturerepublic.com",
    password: "Customer123!",
    role: "customer",
  });

  await Page.insertMany(
    pages.map((page) => ({
      ...page,
      slug: slugify(page.title),
    })),
  );

  await BlogPost.insertMany(
    blogPosts.map((post) => ({
      ...post,
      slug: slugify(post.title),
    })),
  );

  await Banner.insertMany(banners);
  await Setting.insertMany(settings);

  console.log("Seed completed successfully.");
  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error("Seed failed", error);
  await mongoose.connection.close();
  process.exit(1);
});
