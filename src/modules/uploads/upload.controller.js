import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { asyncHandler } from "../../utils/async-handler.js";

const imageProfiles = {
  banners: {
    width: 1600,
    height: 640,
    background: { r: 255, g: 248, b: 243, alpha: 1 },
  },
  products: {
    width: 1200,
    height: 1200,
    background: { r: 255, g: 250, b: 246, alpha: 1 },
  },
  categories: {
    width: 900,
    height: 900,
    background: { r: 255, g: 249, b: 244, alpha: 1 },
  },
  blog: {
    width: 1400,
    height: 900,
    background: { r: 255, g: 250, b: 247, alpha: 1 },
  },
};

async function processImage(filePath, profile) {
  const extension = path.extname(filePath);
  const tempFilePath = filePath.replace(extension, `-processed${extension}`);

  await sharp(filePath)
    .rotate()
    .resize(profile.width, profile.height, {
      fit: "contain",
      position: "centre",
      background: profile.background,
    })
    .toFile(tempFilePath);

  await fs.unlink(filePath);
  await fs.rename(tempFilePath, filePath);
}

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error("Image file is required.");
    error.statusCode = 400;
    throw error;
  }

  const profile = imageProfiles[req.params.folder];
  if (profile) {
    await processImage(req.file.path, profile);
  }

  const filePath = `/uploads/${req.params.folder}/${req.file.filename}`;

  res.status(201).json({
    success: true,
    message: "Image uploaded successfully.",
    data: {
      path: filePath,
      originalName: req.file.originalname,
      ...(profile ? { width: profile.width, height: profile.height } : {}),
    },
  });
});

export { uploadImage };
