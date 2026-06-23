# Payment Server

## Quick Start

```bash
cd payment-server
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

## Configuration (.env)

### Stripe (Primary — Most Popular International)

1. Create a Stripe account at https://dashboard.stripe.com
2. Get your keys from https://dashboard.stripe.com/apikeys
3. Create products/prices at https://dashboard.stripe.com/products
4. Set up webhook endpoint (use `stripe listen` or deploy to a public URL):
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

Required `.env` variables:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PLUS=price_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_PRO_PLUS=price_xxx
```

### PayPal (Optional — Works for Chinese Merchants)

1. Go to https://developer.paypal.com/dashboard
2. Create a REST API app to get Client ID and Secret
3. Create subscription plans in PayPal

```
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_PLAN_PLUS=P-xxx
PAYPAL_PLAN_PRO=P-xxx
PAYPAL_PLAN_PRO_PLUS=P-xxx
```

### LemonSqueezy (Optional — Best for Chinese Developers)

1. Sign up at https://app.lemonsqueezy.com (supports Chinese identity verification)
2. Get API key from Settings > API
3. Create products and variants for each tier
4. Supports Alipay, WeChat Pay, and international credit cards

```
LEMONSQUEEZY_API_KEY=xxx
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_VARIANT_PLUS=123456
LEMONSQUEEZY_VARIANT_PRO=123456
LEMONSQUEEZY_VARIANT_PRO_PLUS=123456
```

### Server

```
PORT=3001
ALLOWED_ORIGINS=http://localhost:3000,https://ai-study.puter.site
SERVER_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

## Frontend

The frontend reads `NEXT_PUBLIC_PAYMENT_SERVER_URL` at build time.
Set it in `.env.local` at the project root:

```
NEXT_PUBLIC_PAYMENT_SERVER_URL=https://your-payment-server.com
```

Default (dev): http://localhost:3001

## Deployment

### Option A: Vercel / Railway / Render

Deploy the `payment-server/` directory as a Node.js service.

### Option B: VPS

```bash
npm run build
node dist/index.js
```

Use PM2 or systemd for process management.

## China-Specific Notes

1. **Stripe**: Requires an overseas entity (HK company or Stripe Atlas). If you don't have one, use LemonSqueezy.

2. **LemonSqueezy**: Best option for Chinese developers:
   - Supports Chinese ID verification
   - Payouts via PayPal or wire transfer
   - Built-in Alipay + WeChat Pay support
   - Handles EU VAT / US sales tax automatically

3. **PayPal**: Works with Chinese PayPal Business accounts. 
   - Requires Chinese business license or individual verification
   - Higher fees than Stripe/LemonSqueezy

4. **Recommended**: Start with **LemonSqueezy** while setting up a Stripe account via HK company.
