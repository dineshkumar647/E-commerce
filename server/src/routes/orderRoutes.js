import { Router } from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { nextOrderState } from "../utils/orderDfa.js";
const router = Router();

router.post("/", protect, async (req, res, next) => {
  try {
    const { items, shipping } = req.body;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: "Cart is empty" });
    const required = ["fullName", "phone", "address", "city", "pincode"];
    if (!shipping || required.some(k => !String(shipping[k] || "").trim())) return res.status(400).json({ message: "Complete all shipping fields" });
    if (!/^[6-9]\d{9}$/.test(shipping.phone)) return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number" });
    if (!/^\d{6}$/.test(shipping.pincode)) return res.status(400).json({ message: "Pincode must contain 6 digits" });

    const normalized = [];
    let total = 0;
    for (const item of items) {
      if (!mongoose.isValidObjectId(item.productId) || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || Number(item.quantity) > 20)
        return res.status(400).json({ message: "Invalid product or quantity" });
      const product = await Product.findById(item.productId);
      if (!product || product.stock < Number(item.quantity)) return res.status(400).json({ message: `Insufficient stock for ${product?.name || "a product"}` });
      normalized.push({ product: product._id, name: product.name, price: product.price, quantity: Number(item.quantity) });
      total += product.price * Number(item.quantity);
    }
    const order = await Order.create({ user: req.user._id, items: normalized, shipping, total, status: "PLACED", history: [{ status: "PLACED", note: "Order placed successfully" }] });
    for (const item of normalized) await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } });
    res.status(201).json(order);
  } catch (e) { next(e); }
});
router.get("/my", protect, async (req, res, next) => {
  try { res.json(await Order.find({ user: req.user._id }).sort({ createdAt: -1 })); }
  catch (e) { next(e); }
});
router.get("/admin/all", protect, adminOnly, async (_req, res, next) => {
  try { res.json(await Order.find().populate("user", "name email").sort({ createdAt: -1 })); }
  catch (e) { next(e); }
});
router.get("/:id", protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (String(order.user) !== String(req.user._id) && req.user.role !== "admin") return res.status(403).json({ message: "Not allowed to view this order" });
    res.json(order);
  } catch (e) { next(e); }
});
router.patch("/:id/status", protect, adminOnly, async (req, res, next) => {
  try {
    const { event } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    const next = nextOrderState(order.status, event);
    if (!next) return res.status(400).json({ message: `DFA rejected transition: ${order.status} + ${event}` });
    order.status = next;
    order.history.push({ status: next, note: `Status changed by admin using event ${event}` });
    await order.save();
    res.json(order);
  } catch (e) { next(e); }
});
export default router;
