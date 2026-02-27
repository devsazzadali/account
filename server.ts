import express from "express";
import { createServer as createViteServer } from "vite";

const PORT = 3000;

// Mock Data
const STORE_PROFILE = {
  name: "AccountStoreOne",
  level: "Legendary",
  memberSince: "30/08/2021",
  orderCompletion: "90.43%",
  disputeRate: "3.61%",
  totalReviews: 17439,
  last90Days: "91.0 %",
  allReviews: "99.1%",
  description: "Selling IPTV ACCOUNTS, 8k strong, trex, dino, etc Hbo max, Disney+, Paramount+, DirecTV, Spotify, Netflix, Origin, CrunchyRoll, Paramount + Minecraft etc.. accounts cheap! 10 AM to 23:00 support and service working! The best store for quality accounts. We provide the best service in the market with instant delivery and 24/7 support. All accounts are verified and come with a warranty. Buy with confidence from a trusted store with thousands of positive reviews. Contact us for bulk orders and special discounts.",
  languages: [
    { name: "American", level: "Fluent" },
    { name: "Spanish", level: "Native" }
  ]
};

const FEATURED_ITEMS = [
  {
    id: 1,
    title: "HULU NO ADS🔥FAST DELIVERY🔥3 MONTHS",
    sold: 676,
    price: 3.00,
    image: "https://picsum.photos/seed/hulu/200/200",
    badge: "🔥",
    category: "Hulu Accounts"
  },
  {
    id: 2,
    title: "Personal Account - NFLX 30days 4K UHD Premium - 1 Month-Need VPN",
    sold: 11886,
    price: 2.75,
    image: "https://picsum.photos/seed/netflix/200/200",
    badge: "NETFLIX",
    category: "NETFLIX Account"
  },
  {
    id: 3,
    title: "🟢✅ Strong 8K IPTV🔥NO LAG🔥 PRIVATE🔥Subscription 12 Months – 4K & 8K UHD...",
    sold: 567,
    price: 33.75,
    image: "https://picsum.photos/seed/iptv/200/200",
    badge: "8K",
    category: "Strong 8K IP TV Accounts"
  },
  {
    id: 4,
    title: "Spotify Premium Individual 1 Month Key | Global Region",
    sold: 1205,
    price: 1.99,
    image: "https://picsum.photos/seed/spotify/200/200",
    badge: "Spotify",
    category: "Spotify Accounts"
  },
  {
    id: 5,
    title: "Disney+ Premium 12 Months Subscription [Private Account]",
    sold: 892,
    price: 15.50,
    image: "https://picsum.photos/seed/disney/200/200",
    badge: "Disney+",
    category: "Disney+ Accounts"
  },
  {
    id: 6,
    title: "VPN 1 Year Subscription - High Speed & Secure",
    sold: 450,
    price: 12.00,
    image: "https://picsum.photos/seed/vpn/200/200",
    badge: "VPN",
    category: "VPN Accounts"
  },
  {
    id: 7,
    title: "Minecraft Java & Bedrock Edition Full Access Account",
    sold: 2100,
    price: 8.50,
    image: "https://picsum.photos/seed/minecraft/200/200",
    badge: "Game",
    category: "Gaming Accounts"
  },
  {
    id: 8,
    title: "Youtube Premium 6 Months Upgrade to your own account",
    sold: 340,
    price: 5.99,
    image: "https://picsum.photos/seed/youtube/200/200",
    badge: "Youtube",
    category: "Youtube Accounts"
  },
  {
    id: 9,
    title: "Crunchyroll Mega Fan 1 Year Warranty",
    sold: 150,
    price: 10.00,
    image: "https://picsum.photos/seed/crunchyroll/200/200",
    badge: "Anime",
    category: "Anime Accounts"
  },
  {
    id: 10,
    title: "NETFLIX 4K UHD 1 YEAR WARRANTY",
    sold: 5000,
    price: 25.00,
    image: "https://picsum.photos/seed/netflix2/200/200",
    badge: "NETFLIX",
    category: "NETFLIX Account"
  },
  {
    id: 11,
    title: "IPTV 12 Months 18K Channels + VOD",
    sold: 1200,
    price: 45.00,
    image: "https://picsum.photos/seed/iptv2/200/200",
    badge: "IPTV",
    category: "IP TV Accounts"
  },
  {
    id: 12,
    title: "NordVPN 2 Year Account",
    sold: 800,
    price: 5.00,
    image: "https://picsum.photos/seed/nordvpn/200/200",
    badge: "VPN",
    category: "VPN Accounts"
  },
  {
    id: 1001,
    title: "Netflix Premium 4K UHD | 1 Month | Private Account",
    sold: 1250,
    price: 3.50,
    image: "https://picsum.photos/seed/dummy1/200/200",
    badge: "HOT",
    category: "NETFLIX Account"
  },
  {
    id: 1002,
    title: "Spotify Premium Individual Upgrade | Lifetime Warranty",
    sold: 850,
    price: 5.00,
    image: "https://picsum.photos/seed/dummy2/200/200",
    badge: "BEST",
    category: "Spotify Accounts"
  },
  {
    id: 1003,
    title: "VPN Pro 1 Year Subscription | 5 Devices | High Speed",
    sold: 2000,
    price: 12.99,
    image: "https://picsum.photos/seed/dummy3/200/200",
    badge: "SALE",
    category: "VPN Accounts"
  },
  {
    id: 1004,
    title: "Disney+ Bundle | No Ads | 6 Months Warranty",
    sold: 450,
    price: 7.99,
    image: "https://picsum.photos/seed/dummy4/200/200",
    badge: "NEW",
    category: "Disney+ Accounts"
  }
];

const CATEGORIES = [
  { name: "NETFLIX Account", offers: 28 },
  { name: "Hulu Accounts", offers: 2 },
  { name: "IP TV Accounts", offers: 8 },
  { name: "Spotify Accounts", offers: 15 },
  { name: "Disney+ Accounts", offers: 10 },
  { name: "VPN Accounts", offers: 20 },
  { name: "Gaming Accounts", offers: 50 },
  { name: "Youtube Accounts", offers: 5 },
  { name: "Anime Accounts", offers: 8 },
  { name: "Strong 8K IP TV Accounts", offers: 5 },
  { name: "B1G IP TV Accounts", offers: 4 },
  { name: "TiviOne IP TV Accounts", offers: 4 },
  { name: "TREX IP TV Accounts", offers: 4 },
  { name: "EVESTV IP TV Accounts", offers: 4 },
  { name: "Ultra 8k IP TV Accounts", offers: 4 },
];

const REVIEWS = [
  { type: 'positive', text: 'NETFLIX Account', buyer: 'Trapos***ich', date: '26/02/2026' },
  { type: 'positive', text: 'Delivered quickly. Excellent service. Good response times. Eagle 4K IP TV Accounts', buyer: 'Hou199***991', date: '26/02/2026' },
  { type: 'positive', text: 'Recieved and working, thanks. NETFLIX Account', buyer: 'Ahmada***ine', date: '26/02/2026' },
  { type: 'positive', text: '*** instant delivery *** product as described *** thx again ***. DZ Accounts', buyer: 'LeChuc***uck', date: '26/02/2026' },
  { type: 'positive', text: 'good. Hulu Accounts', buyer: 'Tilen2***n20', date: '25/02/2026' },
  { type: 'negative', text: 'The support made two replacements, and it stopped working almost immediately. I don\'t recommend it. NETFLIX Account', buyer: 'timohf***ika', date: '25/02/2026' },
  { type: 'positive', text: 'perfect. NETFLIX Account', buyer: 'Freefo***all', date: '25/02/2026' },
  { type: 'positive', text: 'Bought 6 month subsription, stopped working in 2 weeks. Support not responsive. HBO Max Accounts', buyer: 'dr.tse***rma', date: '25/02/2026' },
  { type: 'positive', text: 'Delivered exactly what i wanted in about 30-45 mins. IP TV Accounts', buyer: 'Hayyan***n--', date: '25/02/2026' },
  { type: 'positive', text: 'Great service, fastest delivery. TiviOne IP TV Accounts', buyer: 'sk_mis***isc', date: '25/02/2026' },
];

async function startServer() {
  const app = express();

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // In-memory storage for orders
  const ORDERS: any[] = [];

  // API Routes - Define these BEFORE Vite middleware
  app.get("/api/store/profile", (req, res) => {
    console.log("Serving /api/store/profile");
    res.setHeader('Content-Type', 'application/json');
    res.json(STORE_PROFILE);
  });

  app.post("/api/orders", (req, res) => {
    const { productId, quantity = 1, paymentMethod } = req.body;
    const product = FEATURED_ITEMS.find(p => p.id === productId);

    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    const newOrder = {
        id: Math.floor(Math.random() * 1000000) + 1000,
        productId,
        productTitle: product.title,
        productImage: product.image,
        price: product.price,
        quantity,
        total: product.price * quantity,
        paymentMethod,
        status: "Completed",
        date: new Date().toISOString(),
        deliveryContent: "XXXX-YYYY-ZZZZ-1234" // Mock digital delivery
    };

    ORDERS.push(newOrder);
    console.log(`Order created: ${newOrder.id}`);
    res.json(newOrder);
  });

  app.get("/api/orders/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const order = ORDERS.find(o => o.id === id);
    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ error: "Order not found" });
    }
  });

  app.get("/api/store/featured", (req, res) => {
    // Return top 3 items sorted by sold count descending
    console.log("Serving /api/store/featured");
    const sorted = [...FEATURED_ITEMS].sort((a, b) => b.sold - a.sold);
    res.setHeader('Content-Type', 'application/json');
    res.json(sorted.slice(0, 3));
  });

  app.get("/api/store/categories", (req, res) => {
    console.log("Serving /api/store/categories");
    res.setHeader('Content-Type', 'application/json');
    res.json(CATEGORIES);
  });

  app.get("/api/store/reviews", (req, res) => {
    console.log("Serving /api/store/reviews");
    res.setHeader('Content-Type', 'application/json');
    res.json(REVIEWS);
  });

  app.get("/api/products/:id", (req, res) => {
    const id = parseInt(req.params.id);
    console.log(`Serving /api/products/${id}`);
    res.setHeader('Content-Type', 'application/json');
    
    const product = FEATURED_ITEMS.find(p => p.id === id);
    if (product) {
        // Add more details for the single product view
        const detailedProduct = {
            ...product,
            description: "Instant delivery. 100% Works. Warranty included. Best price in the market.",
            features: ["4K UHD", "Private Account", "Warranty", "24/7 Support"],
            stock: 999,
            deliveryTime: "Instant"
        };
        res.json(detailedProduct);
    } else {
        res.status(404).json({ error: "Product not found" });
    }
  });

  // Catch-all for API routes to prevent falling through to Vite
  app.use("/api/*", (req, res) => {
    console.log(`[Server] API 404: ${req.url}`);
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production (if we were building for prod), we would serve static files here
    // app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
