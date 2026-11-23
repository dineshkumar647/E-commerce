import { Router } from "express";
import Product from "../models/Product.js";
const router = Router();
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== "All") filter.category = req.query.category;
    if (req.query.search) filter.name = { $regex: req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    res.json(await Product.find(filter).sort({ featured: -1, createdAt: -1 }));
  } catch (e) { next(e); }
});
export default router;
