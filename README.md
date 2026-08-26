# Recoverly

A payment recovery and retry-policy engine for recurring/subscription payment
failures — built for Razorpay's Buildathon, Track 3 (AI Revenue Recovery).

## The problem

Subscription businesses lose real revenue to involuntary churn: a customer
doesn't cancel, their renewal payment just fails — expired card,
insufficient funds, a bank auth timeout, an issuer fraud flag. Most
recovery tooling either does nothing, or retries every failure blindly,
which wastes attempts on unrecoverable cases and can get a merchant's
retry privileges throttled by card networks for looking like abuse.

## What this does

1. **Classifies** each failure by decline reason — a fast rule table for
   known codes, an LLM fallback (Gemini, swappable) for anything the rules
   don't recognize.
2. **Decides** the right action per category via a policy engine: retry
   later for soft/temporary issues, never blind-retry hard declines, retry
   auth failures once with a fresh flow, always escalate risk blocks to a
   human. Includes an explicit **stopping rule** — after a max number of
   attempts, it stops and escalates instead of retrying forever.
3. **Executes** the action — a real Razorpay test-mode API call for
   retries, a simulated notification for escalations.
4. **Logs** every classification, decision, and action to an append-only
   audit trail.
5. **Reports** real numbers: amount recovered, recovery rate by category,
   and retries avoided (failures correctly routed away from a pointless
   retry).

## Architecture

Ingestion API → Redis/BullMQ queue → stateless workers (classify → decide
→ execute) → Postgres (including the append-only audit log) → dashboard.

The ingestion API only validates and enqueues — it never processes inline.
Workers are stateless and horizontally scalable: run one, or run twenty,
BullMQ distributes jobs across whichever are running. Scaling up is
"start more worker processes," not a code change.

## What's real vs simulated (be upfront about this with judges)

- **Real:** the classification pipeline, the policy engine and stopping
  rule, the queue/worker architecture, the append-only audit log, the
  Razorpay Order creation API call.
- **Simulated:** whether a retried payment actually *completes*. That
  requires a real customer entering real card details at checkout, which
  can't be automated for a batch of synthetic transactions. The outcome is
  simulated with a probability informed by decline category, and every
  such result is tagged `simulated: true` in the code and audit log.
- **Roadmap, not built:** production would use Razorpay's saved-card /
  recurring-charge API so retries complete without re-entering card
  details, plus real customer notifications instead of logged-only ones.

## Setup

1. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — from your Postgres provider (Neon, Supabase, Railway
     — any works, it's a standard connection string via Prisma)
   - `REDIS_URL` — from Upstash
   - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — from Razorpay Dashboard,
     Test Mode, Settings → API Keys
   - `GEMINI_API_KEY` — from aistudio.google.com
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `http://localhost:3000` for local dev

2. Install dependencies:
   ```
   npm install
   ```

3. Push the schema to your database:
   ```
   npm run prisma:generate
   npm run prisma:push
   ```

4. Start the app:
   ```
   npm run dev
   ```

5. Go to `http://localhost:3000`, click **Sign up**, and create your
   merchant account (company name, email, password). This creates a
   `Merchant` and its first `User` — every merchant needs at least one
   before it exists.

6. On the dashboard, click **Generate new key** under API keys. Copy the
   key shown (it's only shown once) and add it to `.env` as
   `SEED_API_KEY`.

7. In a second terminal, start the worker (a separate long-lived process —
   it won't run on Vercel's serverless functions):
   ```
   npm run worker
   ```

8. In a third terminal, seed synthetic data — this now authenticates with
   the API key from step 6, exactly like a real merchant's backend would:
   ```
   npm run seed 150
   ```

9. Watch the dashboard update live as the worker processes the batch.
   Only your merchant's data is visible — sign up a second account and
   you'll see an empty dashboard, which proves tenant isolation actually
   works.

## Auth model

Two separate mechanisms, on purpose, matching how Stripe and Razorpay
themselves separate these concerns:

- **Dashboard (humans):** email/password via NextAuth, session-based
  (JWT), passwords hashed with bcrypt. Protected by `src/middleware.ts` —
  no session, no access to `/dashboard`, full stop.
- **Ingestion API (machines):** a merchant's backend sends
  `Authorization: Bearer <api_key>`. Keys are generated once, shown once,
  stored only as a SHA-256 hash — losing a key means revoking and issuing
  a new one, there's no "forgot my key" recovery, same as real payment
  providers.

Every table holding transaction data carries a `merchantId`, and every
query in the app is filtered by the session's or API key's resolved
`merchantId`. That's the actual multi-tenancy boundary — a query-level
guarantee, not just a UI convention.

## Known gaps if this went to real production

Naming these openly is a strength in front of judges, not a weakness:

- Rate limiting (`src/lib/rateLimit.ts`) is in-memory and per-process —
  fine for one instance, not for a multi-instance deployment. A real
  version would move this to Upstash Redis (already in the stack) with a
  sliding-window algorithm.
- No email verification or password-reset flow on signup.
- `role` (`admin` vs `viewer`) is stored on `User` but not yet enforced
  anywhere.
- API keys can be created but not individually revoked or rotated from
  the UI yet.

## Deployment

- **App (Next.js):** Vercel
- **Worker:** Railway or Render (needs a long-running process, not serverless)
- **Database:** Neon or Supabase (managed Postgres)
- **Queue:** Upstash (managed Redis)

This is a deliberate choice to spend limited hackathon time on product
logic instead of infrastructure ops. The architecture is cleanly
decoupled (queue-based, stateless workers), so moving to self-managed
infrastructure (AWS/Kubernetes) later is an infra change, not a rewrite.

## Provider independence

All LLM calls go through one interface (`src/lib/llm/provider.ts`).
Swapping Gemini for a different model means writing one new file and
changing one line in `classifier.ts` — nothing else in the codebase
touches a provider SDK directly. Only the minimal fields needed to
classify (decline code, message, amount) are ever sent to the provider —
no customer PII.
