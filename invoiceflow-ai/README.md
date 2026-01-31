# InvoiceFlow AI

Austin's #1 invoicing tool. Clean, modern invoice automation for Austin freelancers and agencies.

## Stack

- **Next.js 15** (App Router, TypeScript, Tailwind)
- **Supabase** (DB + Storage)
- **Stripe** (payments + subscriptions)
- **Resend** (email + PDF attachments)
- **Tesseract.js** (receipt OCR)
- **jsPDF** (invoice PDF)
- **Recharts** (analytics)
- **Framer Motion** (micro-animations)

## Design (Austin Edition)

- **Colors**: Deep Teal `#0f4c5c`, Sunrise Orange `#f4a261`, Off-White `#f8f9fa`, Sage Green `#87a96b`
- **Typography**: Poppins, 14–18px body, 28–52px headers, 125% line height
- **Style**: Neumorphism, 16px radius, glassmorphism header
- **Layout**: 1100px max-width, 40px gutters

## Setup

1. Clone and install:
   ```bash
   cd invoiceflow-ai && npm install
   ```

2. Copy env and fill in values:
   ```bash
   cp .env.example .env.local
   ```

3. Supabase:
   ```bash
   npx supabase init && npx supabase start
   ```
   Run migrations and create Storage buckets `receipts` and `invoices` in Supabase dashboard.

4. Run dev:
   ```bash
   npm run dev
   ```
   Opens at [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

1. **If you see 404 NOT_FOUND** – Your repo root may be the parent of `invoiceflow-ai`. In Vercel:
   - Go to **Project → Settings → General**
   - Set **Root Directory** to `invoiceflow-ai` (or the folder that contains `package.json`)
   - Save and redeploy

2. Deploy:
   ```bash
   cd invoiceflow-ai && vercel --prod
   ```
   Or connect the repo in Vercel and ensure Root Directory points to the app folder.

3. Set env vars in **Project → Settings → Environment Variables** (see `.env.example`). Cron runs daily for overdue invoice reminders.

## Routes

- `/` – Landing
- `/dashboard` – Invoices + receipt upload (OCR → Save Expense)
- `/dashboard/invoices/new` – New invoice (client + expenses → PDF, Stripe, Resend)
- `/dashboard/clients` – Clients table (TanStack Table)
- `/dashboard/analytics` – Revenue line, expense donut, stat cards, CSV export
- `/dashboard/reports` – Reports
- `/dashboard/settings` – Invoice template (logo, signature)
- `/pro` – Austin Pro $19/mo (Stripe subscription)

## API

- `POST /api/expenses` – Save expense + upload receipt to Supabase Storage
- `GET /api/expenses/list` – List expenses
- `GET /api/clients` – List clients
- `POST /api/invoices/send` – Generate PDF, Stripe checkout, save invoice, Resend email
- `POST /api/categorize` – OpenAI expense category
- `GET /api/automations/cron` – Daily overdue reminders (auth: `Bearer CRON_SECRET`)
- `POST /api/stripe/create-checkout` – Stripe subscription checkout

Perfect for Austin devs & agencies.
