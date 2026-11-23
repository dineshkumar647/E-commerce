import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Search, User, Package, ShieldCheck, Truck, CheckCircle2, X, Plus, Minus, LogOut, ArrowRight, Menu, Star, Heart, SlidersHorizontal, Eye } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const money = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const steps = ["PLACED","CONFIRMED","PACKED","SHIPPED","OUT_FOR_DELIVERY","DELIVERED"];
const events = { PLACED: ["CONFIRM","CANCEL"], CONFIRMED: ["PACK","CANCEL"], PACKED: ["SHIP"], SHIPPED: ["OUT_FOR_DELIVERY"], OUT_FOR_DELIVERY: ["DELIVER"] };

export default function App() {
  const [products,setProducts] = useState([]);
  const [category,setCategory] = useState("All");
  const [search,setSearch] = useState("");
  const [cart,setCart] = useState([]);
  const [user,setUser] = useState(() => JSON.parse(localStorage.getItem("sf_user") || "null"));
  const [token,setToken] = useState(() => localStorage.getItem("sf_token") || "");
  const [modal,setModal] = useState("");
  const [authMode,setAuthMode] = useState("login");
  const [form,setForm] = useState({name:"",email:"",password:""});
  const [shipping,setShipping] = useState({fullName:"",phone:"",address:"",city:"",pincode:""});
  const [orders,setOrders] = useState([]);
  const [notice,setNotice] = useState("");
  const [loading,setLoading] = useState(false);
  const [selectedOrder,setSelectedOrder] = useState(null);
  const [mobileMenu,setMobileMenu] = useState(false);
  const [selectedProduct,setSelectedProduct] = useState(null);
  const [reviews,setReviews] = useState([]);
  const [reviewSummary,setReviewSummary] = useState({average:0,count:0});
  const [reviewForm,setReviewForm] = useState({rating:5,title:"",comment:""});
  const [sort,setSort] = useState("featured");
  const [wishlistOnly,setWishlistOnly] = useState(false);
  const [wishlist,setWishlist] = useState(() => JSON.parse(localStorage.getItem("sf_wishlist") || "[]"));

  async function api(path, options={}) {
    const response = await fetch(`${API}${path}`, { ...options, headers: { "Content-Type":"application/json", ...(token ? {Authorization:`Bearer ${token}`} : {}), ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }
  async function loadProducts() {
    try { setProducts(await api(`/products?category=${encodeURIComponent(category)}&search=${encodeURIComponent(search)}`)); }
    catch(e) { setNotice(`${e.message}. Start the backend and MongoDB.`); }
  }
  useEffect(() => { loadProducts(); }, [category,search]);
  useEffect(() => { if(user) loadOrders(); }, [user]);
  async function loadOrders() { try { setOrders(await api(user?.role === "admin" ? "/orders/admin/all" : "/orders/my")); } catch(e) { setNotice(e.message); } }
  const cartCount = cart.reduce((n,x)=>n+x.quantity,0);
  const total = cart.reduce((n,x)=>n+x.price*x.quantity,0);
  const categories = ["All","Electronics","Fashion","Home","Books"];

  function add(product) {
    setCart(old => old.some(x=>x._id===product._id) ? old.map(x=>x._id===product._id?{...x,quantity:Math.min(20,x.quantity+1)}:x) : [...old,{...product,quantity:1}]);
    setNotice(`${product.name} added to your cart`);
  }
  function changeQty(id,delta) { setCart(old=>old.map(x=>x._id===id?{...x,quantity:Math.max(1,Math.min(20,x.quantity+delta))}:x)); }
  function logout() { setToken("");setUser(null);localStorage.removeItem("sf_token");localStorage.removeItem("sf_user");setOrders([]);setModal(""); }
  async function submitAuth(e) {
    e.preventDefault(); setLoading(true);
    try {
      const data = await api(`/auth/${authMode}`,{method:"POST",body:JSON.stringify(form)});
      setToken(data.token);setUser(data.user);localStorage.setItem("sf_token",data.token);localStorage.setItem("sf_user",JSON.stringify(data.user));
      setModal("");setForm({name:"",email:"",password:""});setNotice(`Welcome, ${data.user.name}`);
    } catch(err) { setNotice(err.message); } finally { setLoading(false); }
  }
  async function checkout(e) {
    e.preventDefault();
    if(!user) { setModal("auth");setNotice("Please login before checkout");return; }
    setLoading(true);
    try {
      const order = await api("/orders",{method:"POST",body:JSON.stringify({items:cart.map(x=>({productId:x._id,quantity:x.quantity})),shipping})});
      setCart([]);setModal("");setShipping({fullName:"",phone:"",address:"",city:"",pincode:""});await loadOrders();setSelectedOrder(order);setModal("tracking");setNotice("Order placed successfully!");
    } catch(err) { setNotice(err.message); } finally { setLoading(false); }
  }
  async function updateStatus(order,event) {
    try { await api(`/orders/${order._id}/status`,{method:"PATCH",body:JSON.stringify({event})});await loadOrders();setNotice(`DFA accepted ${event}`); }
    catch(e) { setNotice(e.message); }
  }
  const visibleOrders = useMemo(()=>orders,[orders]);
  const sortedProducts = useMemo(() => [...products].filter(p=>!wishlistOnly || wishlist.includes(p._id)).sort((a,b) => sort === "price-low" ? a.price-b.price : sort === "price-high" ? b.price-a.price : sort === "name" ? a.name.localeCompare(b.name) : Number(b.featured)-Number(a.featured)), [products,sort,wishlistOnly,wishlist]);
  function toggleWishlist(product) {
    setWishlist(old => { const next = old.includes(product._id) ? old.filter(id=>id!==product._id) : [...old,product._id]; localStorage.setItem("sf_wishlist",JSON.stringify(next)); return next; });
  }
  async function openProduct(product) {
    setSelectedProduct(product); setModal("product"); setReviews([]); setReviewSummary({average:0,count:0}); setReviewForm({rating:5,title:"",comment:""});
    try { const data = await api(`/reviews/${product._id}`); setReviews(data.reviews || []); setReviewSummary({average:data.average || 0,count:data.count || 0}); }
    catch(e) { setNotice(e.message); }
  }
  async function submitReview(e) {
    e.preventDefault(); if(!selectedProduct) return;
    try { await api(`/reviews/${selectedProduct._id}`,{method:"POST",body:JSON.stringify(reviewForm)}); setReviewForm({rating:5,title:"",comment:""}); const data=await api(`/reviews/${selectedProduct._id}`); setReviews(data.reviews || []); setReviewSummary({average:data.average || 0,count:data.count || 0}); setNotice("Thanks! Your verified review was added."); }
    catch(e) { setNotice(e.message); }
  }

  return <div className="app">
    <div className="topline">Free delivery on orders above ₹1,999 <span> · Secure checkout · Easy order tracking</span></div>
    <header className="header">
      <a className="brand" href="#"><span className="brand-icon"><ShoppingBag size={21}/></span> shopflow<span className="dot">.</span></a>
      <nav className={mobileMenu?"nav open":"nav"}><a href="#shop" onClick={()=>setMobileMenu(false)}>Shop</a><a href="#benefits" onClick={()=>setMobileMenu(false)}>Why ShopFlow</a>{user&&<a href="#orders" onClick={()=>setMobileMenu(false)}>My orders</a>}</nav>
      <div className="header-actions">
        {user ? <button className="user-pill" onClick={logout}><User size={16}/>{user.name.split(" ")[0]} <LogOut size={14}/></button> : <button className="icon-btn" onClick={()=>setModal("auth")}><User size={19}/><span>Login</span></button>}
        <button className="saved-btn" onClick={()=>{setWishlistOnly(v=>!v);document.getElementById("shop")?.scrollIntoView({behavior:"smooth"})}}><Heart size={16}/> Saved <b>{wishlist.length}</b></button><button className="cart-btn" onClick={()=>setModal("cart")}><ShoppingBag size={18}/> Cart <b>{cartCount}</b></button>
        <button className="menu-btn" onClick={()=>setMobileMenu(!mobileMenu)}><Menu/></button>
      </div>
    </header>
    {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice("")}><X size={15}/></button></div>}
    <main>
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span/> THE SMARTER WAY TO SHOP</div><h1>Good finds.<br/><em>Great feeling.</em></h1><p>Discover everyday essentials and little upgrades that make life better. Thoughtfully picked, fairly priced.</p><a className="primary-btn" href="#shop">Explore collection <ArrowRight size={17}/></a><div className="hero-proof"><div className="avatars"><i>R</i><i>A</i><i>K</i></div><span><b>2,400+</b> happy shoppers</span></div></div>
        <div className="hero-art"><div className="art-circle"></div><div className="floating-card card-one"><span>✦</span><b>Made for<br/>your everyday</b></div><div className="product-emoji">🛍️</div><div className="floating-card card-two"><b>4.9/5</b><small>customer love</small>★★★★★</div><div className="art-caption">THE EVERYDAY EDIT <span>01 / 04</span></div></div>
      </section>
      <section className="benefits" id="benefits"><div><ShieldCheck/><b>Secure payments</b><small>Your details stay protected</small></div><div><Truck/><b>Quick delivery</b><small>Track every step</small></div><div><CheckCircle2/><b>Quality picks</b><small>Products worth keeping</small></div><div><Package/><b>Easy order updates</b><small>Know what’s happening</small></div></section>
      <section className="shop-section" id="shop">
        <div className="section-head"><div><div className="eyebrow">CURATED FOR YOU</div><h2>Find your <em>favourite.</em></h2><p>Little things. Big everyday improvements.</p></div><div className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..."/></div></div>
        <div className="shop-tools"><div className="filters">{categories.map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div><label className="sort-box"><SlidersHorizontal size={15}/><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A to Z</option></select></label></div>
        <div className="products">{sortedProducts.map((p,i)=><article className="product-card" key={p._id} onClick={()=>openProduct(p)}><div className={`product-image tone-${i%4}`}><span className="product-art">{p.image}</span>{p.featured&&<span className="tag">POPULAR PICK</span>}<button className={`wish-btn ${wishlist.includes(p._id)?"selected":""}`} onClick={e=>{e.stopPropagation();toggleWishlist(p)}} aria-label="Add to wishlist"><Heart size={17} fill={wishlist.includes(p._id)?"currentColor":"none"}/></button><button className="quick-add" onClick={e=>{e.stopPropagation();add(p)}} aria-label="Add to cart"><Plus/></button></div><div className="product-info"><small>{p.category}</small><h3>{p.name}</h3><p>{p.description}</p><div className="rating-line"><span className="stars">★</span><span>Read customer reviews</span></div><div className="price-row"><b>{money(p.price)}</b><span>{p.stock>0?`${p.stock} in stock`:"Out of stock"}</span></div><button className="details-link" onClick={e=>{e.stopPropagation();openProduct(p)}}><Eye size={14}/> View details & reviews</button></div></article>)}</div>
        {!sortedProducts.length&&<div className="empty">{wishlistOnly?"Your saved products will appear here.":"No products found. Try another search."}</div>}
      </section>
      <section className="promo"><div><div className="eyebrow">A BETTER EVERYDAY STARTS HERE</div><h2>Make room for<br/><em>the good stuff.</em></h2><p>Shop the collection and find something you’ll love.</p><a href="#shop" className="light-btn">Shop now <ArrowRight size={16}/></a></div><div className="promo-emoji">🎁</div></section>
      {user&&<section className="orders-section" id="orders"><div className="section-head"><div><div className="eyebrow">YOUR SHOPPING ACTIVITY</div><h2>My <em>orders.</em></h2></div><button className="outline-btn" onClick={loadOrders}>Refresh orders</button></div>
        {visibleOrders.length===0?<div className="empty">Your orders will appear here after checkout.</div>:<div className="order-list">{visibleOrders.map(o=><div className="order-row" key={o._id}><div><small>ORDER · {o._id.slice(-8).toUpperCase()}</small><b>{money(o.total)}</b><span>{o.items.map(x=>`${x.name} × ${x.quantity}`).join(", ")}</span></div><div className="order-right"><span className={`status status-${o.status.toLowerCase()}`}>{o.status.replaceAll("_"," ")}</span><button className="text-btn" onClick={()=>{setSelectedOrder(o);setModal("tracking")}}>Track order →</button>{user.role==="admin"&&events[o.status]?.map(ev=><button className="mini-btn" key={ev} onClick={()=>updateStatus(o,ev)}>{ev.replaceAll("_"," ")}</button>)}</div></div>)}</div>}
      </section>}
    </main>
    <footer><a className="brand" href="#"><span className="brand-icon"><ShoppingBag size={18}/></span> shopflow<span className="dot">.</span></a><p>Thoughtful shopping. Simple living.</p><small>© 2026 ShopFlow · University project demonstration</small></footer>

    {modal&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setModal("")}}><div className="modal">
      <button className="close" onClick={()=>setModal("")}><X/></button>
      {modal==="product"&&selectedProduct&&<><div className="eyebrow">PRODUCT DETAILS</div><div className="detail-layout"><div className="detail-art"><span>{selectedProduct.image}</span></div><div className="detail-copy"><small>{selectedProduct.category}</small><h2>{selectedProduct.name}</h2><div className="rating-line"><span className="stars">★★★★★</span><b>{reviewSummary.count ? reviewSummary.average.toFixed(1) : "New"}</b><span>({reviewSummary.count} reviews)</span></div><h3>{money(selectedProduct.price)}</h3><p>{selectedProduct.description}</p><p className="stock-note">{selectedProduct.stock>0?`In stock · ${selectedProduct.stock} available`:"Currently out of stock"}</p><button className="primary-btn full" disabled={selectedProduct.stock<1} onClick={()=>add(selectedProduct)}>Add to cart <ShoppingBag size={16}/></button><button className="outline-btn full" onClick={()=>toggleWishlist(selectedProduct)}><Heart size={15}/> {wishlist.includes(selectedProduct._id)?"Remove from wishlist":"Add to wishlist"}</button></div></div><div className="review-section"><div className="review-heading"><div><div className="eyebrow">CUSTOMER FEEDBACK</div><h2>Reviews <em>& ratings</em></h2></div><div className="review-score"><b>{reviewSummary.count?reviewSummary.average.toFixed(1):"—"}</b><span className="stars">★★★★★</span><small>{reviewSummary.count} reviews</small></div></div>{reviews.length===0?<div className="empty">No reviews yet. Customers who have ordered this product can leave the first review.</div>:<div className="review-list">{reviews.map(r=><article className="review-card" key={r._id}><div className="review-top"><b>{r.name}</b><span className="verified">✓ Verified purchase</span><small>{new Date(r.createdAt).toLocaleDateString("en-IN")}</small></div><div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</div><h4>{r.title}</h4><p>{r.comment}</p></article>)}</div>}<div className="write-review"><h3>Write a review</h3>{user?<form className="form" onSubmit={submitReview}><label>Your rating<select value={reviewForm.rating} onChange={e=>setReviewForm({...reviewForm,rating:Number(e.target.value)})}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} star{n>1?"s":""}</option>)}</select></label><label>Review title<input required minLength="3" maxLength="80" value={reviewForm.title} onChange={e=>setReviewForm({...reviewForm,title:e.target.value})} placeholder="Summarise your experience"/></label><label>Your review<textarea required minLength="10" maxLength="1000" value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})} placeholder="Tell others what you liked..."/></label><button className="primary-btn full">Submit review</button></form>:<p className="modal-sub">Please sign in and order this product before writing a verified review.</p>}</div></div></>}
      {modal==="auth"&&<><div className="eyebrow">WELCOME TO SHOPFLOW</div><h2>{authMode==="login"?"Good to see you.":"Create your account."}</h2><p className="modal-sub">Sign in to place orders and track deliveries.</p><form onSubmit={submitAuth} className="form">
        {authMode==="register"&&<label>Full name<input required minLength="2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label>}
        <label>Email address<input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>
        <label>Password<input type="password" required minLength="8" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters"/></label>
        <button className="primary-btn full" disabled={loading}>{loading?"Please wait...":authMode==="login"?"Sign in":"Create account"}</button>
      </form><p className="switch">{authMode==="login"?"New to ShopFlow?":"Already have an account?"} <button onClick={()=>setAuthMode(authMode==="login"?"register":"login")}>{authMode==="login"?"Create account":"Sign in"}</button></p></>}
      {modal==="cart"&&<><div className="eyebrow">YOUR BAG</div><h2>Shopping <em>cart.</em></h2>{cart.length===0?<div className="empty">Your cart is waiting for something good.</div>:<><div className="cart-items">{cart.map(x=><div className="cart-item" key={x._id}><div className="cart-emoji">{x.image}</div><div className="cart-detail"><b>{x.name}</b><span>{money(x.price)}</span><div className="qty"><button onClick={()=>changeQty(x._id,-1)}><Minus size={13}/></button>{x.quantity}<button onClick={()=>changeQty(x._id,1)}><Plus size={13}/></button><button className="remove" onClick={()=>setCart(cart.filter(y=>y._id!==x._id))}>Remove</button></div></div><b>{money(x.price*x.quantity)}</b></div>)}</div><div className="cart-total"><span>Subtotal</span><b>{money(total)}</b></div><button className="primary-btn full" onClick={()=>setModal(user?"checkout":"auth")}>Continue to checkout <ArrowRight size={16}/></button></>}</>}
      {modal==="checkout"&&<><div className="eyebrow">ALMOST YOURS</div><h2>Delivery <em>details.</em></h2><p className="modal-sub">Your order total is <b>{money(total)}</b></p><form className="form" onSubmit={checkout}>
        <label>Full name<input required minLength="2" value={shipping.fullName} onChange={e=>setShipping({...shipping,fullName:e.target.value})}/></label>
        <label>Mobile number<input required pattern="[6-9][0-9]{9}" maxLength="10" value={shipping.phone} onChange={e=>setShipping({...shipping,phone:e.target.value})} placeholder="10-digit mobile number"/></label>
        <label>Address<textarea required minLength="8" value={shipping.address} onChange={e=>setShipping({...shipping,address:e.target.value})} placeholder="House no, street, area"/></label>
        <div className="two-col"><label>City<input required value={shipping.city} onChange={e=>setShipping({...shipping,city:e.target.value})}/></label><label>Pincode<input required pattern="[0-9]{6}" maxLength="6" value={shipping.pincode} onChange={e=>setShipping({...shipping,pincode:e.target.value})}/></label></div>
        <button className="primary-btn full" disabled={loading}>{loading?"Placing order...":`Place order · ${money(total)}`}</button>
      </form></>}
      {modal==="tracking"&&selectedOrder&&<><div className="eyebrow">ORDER TRACKING</div><h2>Your order is <em>on its way.</em></h2><p className="modal-sub">Order #{selectedOrder._id.slice(-8).toUpperCase()} · {money(selectedOrder.total)}</p><div className="tracking">{(selectedOrder.history||[]).map((h,i)=><div className="track-step" key={i}><span className="track-dot">{i===selectedOrder.history.length-1?<CheckCircle2 size={16}/>:<span/>}</span><div><b>{h.status.replaceAll("_"," ")}</b><small>{new Date(h.at).toLocaleString("en-IN")}</small><p>{h.note}</p></div></div>)}</div><div className="dfa-note"><ShieldCheck size={18}/> Each status update is checked by the Order DFA.</div><button className="outline-btn full" onClick={()=>setModal("")}>Continue shopping</button></>}
    </div></div>}
  </div>;
}
