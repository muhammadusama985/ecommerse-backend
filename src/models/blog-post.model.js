import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    excerpt: { type: String, trim: true },
    content: { type: String, required: true, trim: true },
    coverImage: { type: String, trim: true },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

const BlogPost = mongoose.model("BlogPost", blogPostSchema);

export { BlogPost };
