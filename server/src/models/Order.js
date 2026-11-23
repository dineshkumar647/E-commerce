import mongoose from "mongoose";
const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String, price: Number, quantity: { type: Number, min: 1, required: true }
}, { _id: false });
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: { type: [itemSchema], required: true },
  shipping: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  total: { type: Number, required: true },
  status: { type: String, enum: ["PLACED","CONFIRMED","PACKED","SHIPPED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"], default: "PLACED" },
  history: [{ status: String, at: { type: Date, default: Date.now }, note: String }]
}, { timestamps: true });
export default mongoose.model("Order", orderSchema);
