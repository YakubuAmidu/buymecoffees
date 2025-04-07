const dotenv = require('dotenv');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

dotenv.config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

// ✅ Allowed Origins (include your latest ngrok URL)
const allowedOrigins = [
  "http://127.0.0.1:8080",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:4040",
  "https://buymecoffees.org",
  "https://1c6e-2607-fb90-bda8-5e9c-f864-bec6-4f88-6996.ngrok-free.app"
];

// ✅ CORS Middleware
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("❌ CORS Blocked:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests

// ✅ Debug incoming request info
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log("🛰️ Origin:", req.headers.origin || "Direct Browser Request");
  next();
});

// ✅ Other security middlewares
app.use(helmet());
app.use(xss());
app.use(hpp());
app.use(express.json());
app.use(morgan('dev'));

// ✅ Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP. Try again after 15 minutes.'
});
app.use(limiter);

// ✅ Stripe Checkout Endpoint
app.post('/create-checkout-session', async (req, res) => {
  const { amount } = req.body;

  if (!amount || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Buy me a coffee ☕',
          },
          unit_amount: amount * 100, // in cents
        },
        quantity: 1,
      }],
      success_url: 'https://buymecoffees.org/success.html',
      cancel_url: 'https://buymecoffees.org/cancel.html',
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("❌ Stripe session error:", error.message);
    res.status(500).json({ error: 'Unable to create checkout session' });
  }
});

// ✅ Home Route for testing
app.get("/", (req, res) => {
  res.send("✅ Server is live & working with Stripe & CORS!");
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});


