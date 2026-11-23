import { Router } from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { protect } from "../middleware/auth.js";
const router = Router();

// Public: list reviews and summary for a product.
router.get("/:productId", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product ID" });
    const product = await Product.findById(req.params.productId).select("_id");
    if (!product) return res.status(404).json({ message: "Product not found" });
    const [reviews, summary] = await Promise.all([
      Review.find({ product: product._id }).sort({ createdAt: -1 }).select("name rating title comment verifiedPurchase createdAt"),
      Review.aggregate([{ $match: { product: product._id } }, { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } }])
    ]);
    res.json({ reviews, average: summary[0]?.average || 0, count: summary[0]?.count || 0 });
  } catch (e) { next(e); }
});

// Only an account that has ordered this product can review it; one review per product/account.
router.post("/:productId", protect, async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product ID" });
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) return res.status(400).json({ message: "Choose a rating from 1 to 5 stars" });
    if (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 80) return res.status(400).json({ message: "Review title must be 3–80 characters" });
    if (typeof comment !== "string" || comment.trim().length < 10 || comment.trim().length > 1000) return res.status(400).json({ message: "Review must be 10–1000 characters" });
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const purchased = await Order.exists({ user: req.user._id, "items.product": product._id });
    if (!purchased) return res.status(403).json({ message: "You can review this product after ordering it." });
    const review = await Review.create({ product: product._id, user: req.user._id, name: req.user.name, rating: Number(rating), title: title.trim(), comment: comment.trim(), verifiedPurchase: true });
    res.status(201).json(review);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "You have already reviewed this product." });
    next(e);
  }
});
export default router;
