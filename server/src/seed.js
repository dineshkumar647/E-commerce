import dotenv from "dotenv"; dotenv.config();
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Product from "./models/Product.js";
await mongoose.connect(process.env.MONGODB_URI);
await User.deleteMany({ email: { $in: ["admin@shopflow.demo", "customer@shopflow.demo"] } });
await User.create([
  { name: "ShopFlow Admin", email: "admin@shopflow.demo", password: await bcrypt.hash("Admin@123", 12), role: "admin" },
  { name: "Demo Customer", email: "customer@shopflow.demo", password: await bcrypt.hash("Customer@123", 12), role: "customer" }
]);
const products = [
  ["Wireless Headphones","Electronics","Clear sound with comfortable ear cushions.",2499,"🎧",18,true],
  ["Smart Watch","Electronics","Everyday activity and notification companion.",3299,"⌚",14,true],
  ["Travel Backpack","Fashion","Durable backpack for college and travel.",1199,"🎒",25,true],
  ["Classic Sneakers","Fashion","Comfortable casual shoes for daily use.",1899,"👟",16,false],
  ["Desk Lamp","Home","Adjustable study lamp with a minimal design.",799,"💡",30,false],
  ["Coffee Mug","Home","Reusable ceramic mug for your desk.",349,"☕",40,false],
  ["Notebook Set","Books","Five notebooks for notes and planning.",299,"📚",50,false],
  ["Bluetooth Speaker","Electronics","Portable speaker for music and podcasts.",1599,"🔊",12,false]
];
await Product.deleteMany({});
await Product.insertMany(products.map(([name,category,description,price,image,stock,featured]) => ({name,category,description,price,image,stock,featured})));
console.log("Seed complete. Demo admin and customer accounts created.");
await mongoose.disconnect();
