import express from "express";
import cors from "cors";
import { stripeRouter } from "./stripe";
import { paypalRouter } from "./paypal";
import { lemonSqueezyRouter } from "./lemonsqueezy";
import { paddleRouter } from "./paddle";
import { payoneerRouter } from "./payoneer";
import { subscriptionRouter } from "./subscription-status";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",");

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", providers: detectProviders() });
});

app.use("/api/stripe", stripeRouter);
app.use("/api/paypal", paypalRouter);
app.use("/api/lemonsqueezy", lemonSqueezyRouter);
app.use("/api/paddle", paddleRouter);
app.use("/api/payoneer", payoneerRouter);
app.use("/api/subscription-status", subscriptionRouter);

function detectProviders() {
  const providers: string[] = [];
  if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_")) providers.push("stripe");
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) providers.push("paypal");
  if (process.env.LEMONSQUEEZY_API_KEY) providers.push("lemonsqueezy");
  if (process.env.PADDLE_API_KEY) providers.push("paddle");
  if (process.env.PAYONEER_CLIENT_ID && process.env.PAYONEER_CLIENT_SECRET) providers.push("payoneer");
  return providers;
}

app.listen(PORT, () => {
  console.log(`[payment-server] running on http://localhost:${PORT}`);
  console.log(`[payment-server] enabled providers: ${detectProviders().join(", ") || "none — configure .env"}`);
});

export default app;