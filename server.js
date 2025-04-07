// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const bodyParser = require('body-parser');

dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

// Rate Limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: '⚠️ Too many requests. Try again in 15 mins.'
}));

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf; // Store raw body for webhook verification
    },
  })
);

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

// Stripe needs the raw body to verify the webhook signature
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

// ✅ JSON
app.use(express.json());

// ✅ Stripe webhook event
app.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecrete = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event.stripes.webhooks.constructEvent(req.body, sig, endpointSecrete);
    console.log('✅ Webhook verified: ', event.type);
  } catch (error) {
    console.error('❌ Webhook Signature verification failed:', error.message);
    return res.status(400).send(`Webhook Eror: ${error.message}`);
  }

  // ✅ Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('💰 Payment Success Session: ', session);
    // TODO: You can log donation or trigger thank-you email, etc
  }

  res.status(200).json({ received: true });
});


// Home Test Route
app.get('/', (req, res) => {
  res.send('☕ Buy Me a Coffee API is live!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



