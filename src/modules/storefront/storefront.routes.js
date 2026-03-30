import { Router } from "express";
import { getBestSellerPageData, getHomePageData } from "./storefront.controller.js";

const storefrontRouter = Router();

storefrontRouter.get("/home", getHomePageData);
storefrontRouter.get("/best-sellers", getBestSellerPageData);

export { storefrontRouter };
