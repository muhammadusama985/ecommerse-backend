import { Router } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { uploadImage } from "./upload.controller.js";

const allowedFolders = ["products", "categories", "banners", "blog", "users", "reviews"];

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const folder = req.params.folder;
    if (!allowedFolders.includes(folder)) {
      return cb(new Error("Invalid upload folder."));
    }

    const destinationPath = path.join("uploads", folder);

    try {
      fs.mkdirSync(destinationPath, { recursive: true });
    } catch (error) {
      return cb(error);
    }

    return cb(null, destinationPath);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed."));
    }

    return cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadRouter = Router();

uploadRouter.post(
  "/:folder",
  authenticate,
  requireRole("admin"),
  upload.single("image"),
  uploadImage,
);

export { uploadRouter };
