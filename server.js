// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

dotenv.config();
const app = express();

// Allowed domains
const allowedOrigins = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "https://buymecoffees.org"
];

// CORS setup
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("❌ CORS Blocked:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// Security & body parsing middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(xss());
app.use(hpp());
app.use(express.json());

// Rate Limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '⚠️ Too many requests. Try again in 15 mins.'
}));

// Stripe Checkout Session Route
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
            name: '☕ Buy Me a Coffee',
          },
          unit_amount: amount * 100,
        },
        quantity: 1
      }],
      success_url: 'https://buymecoffees.org/success.html',
      cancel_url: 'https://buymecoffees.org/cancel.html'
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe Error:', err.message);
    res.status(500).json({ error: 'Stripe session error' });
  }
});

// Home Test Route
app.get('/', (req, res) => {
  res.send('☕ Buy Me a Coffee API is live!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



