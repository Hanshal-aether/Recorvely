# Recoverly

**A payment recovery engine that recovers revenue with judgment, not brute force.**

Built for Razorpay's Buildathon — Track 3, AI Revenue Recovery.

**Live demo:** https://recoverly-phi.vercel.app/

---

## The problem, in one line

Subscription businesses lose real money every day to payments that fail
for no fault of the customer — an expired card, a temporary bank
decline, an authentication timeout. Most systems handle this badly:
either they do nothing, or they retry every failure the same way,
blindly, which wastes attempts on cards that will never work again and
can get a merchant's retry privileges throttled by card networks for
looking abusive.

**Who actually uses this:** Razorpay's own merchants — any business
billing customers repeatedly (SaaS, subscriptions, EMIs) plugs their
failed-payment events into Recoverly's ingestion API the same way they'd
integrate any backend service, automatically, no human involved. The
`npm run seed` script in this repo is our test harness standing in for
that real integration, not how it would run in production.

## What we actually built

- A **classifier** that reads *why* a payment failed and sorts it into
  one of four categories, using instant rule matching for known codes
  and an LLM fallback only for the ones rules can't confidently place.
- A **policy engine** that picks a genuinely different response per
  category — retry later for temporary issues, never retry a dead card,
  retry an auth timeout once with a fresh flow, always escalate
  suspected fraud to a human — and a real **stopping rule** that gives
  up after a configurable number of attempts instead of retrying
  forever.
- A **scheduler** that actually comes back and executes those delayed
  retries on its own, live, with no human triggering it — proven
  working, not just designed.
- **Real Razorpay test-mode API calls** for every retry attempt.
- A **multi-tenant platform**: each merchant signs up, gets an isolated
  account enforced at the database query level (not just the UI), and
  authenticates their backend with a revocable API key — never a
  password, matching how Razorpay and Stripe separate human vs machine
  auth themselves.
- An **append-only audit trail** for every classification, decision,
  and action taken, readable as plain sentences in the dashboard.

## The design decision we think matters most: minimal data to the AI

We deliberately built the AI layer so that **nothing about a
transaction reaches the LLM except the three fields needed to classify
it** — the decline code, the decline message, and the amount. No
customer name, no card details, no PII of any kind, ever leaves our
system toward a third-party model provider. This wasn't an
afterthought; it's the reason `src/lib/llm/provider.ts` exists as a
strict interface that every provider implementation must go through —
nothing else in the codebase is allowed to call an LLM SDK directly.
One side effect of designing it this way: swapping Gemini for any other
model is a one-file change, so a company like Razorpay is never locked
into a single AI vendor by adopting this.

## Real numbers from a live run

_Fill in from your dashboard after a fresh seed run before submitting:_
- Amount recovered: ₹7,55,843
- Recovery rate: 38.1%
- Retries avoided (correctly *not* retried): 257
- Transactions processed: 761

## Architecture

Ingestion API → Redis/BullMQ queue → stateless worker (classify →
decide → execute or schedule) → Postgres, including the append-only
audit log → dashboard. A separate scheduler process independently polls
for due scheduled retries and executes them through the same shared
logic the worker uses, which is what makes the stopping rule fire
correctly even after repeated failures over time.

The ingestion API does the minimum possible work — validate the API
key, write the record, push a queue job, return — so a traffic spike
never blocks it. Workers are stateless and horizontally scalable: run
one, or run twenty, nothing changes but throughput.

## Honest scope — what's real, what's simulated, what's roadmap

We'd rather state this plainly than have a judge discover it.

- **Real:** classification, the policy engine and stopping rule, the
  full queue/worker/scheduler pipeline, the audit log, Razorpay Order
  creation, multi-tenant auth, revocable API keys.
- **Simulated:** whether a retried payment actually *completes*. That
  requires a real customer entering real card details at checkout,
  which can't be automated for synthetic test transactions — the
  outcome is simulated with a probability informed by decline category
  and explicitly tagged `simulated: true` everywhere it appears,
  including the audit log.
- **Roadmap:** production-grade distributed rate limiting (current
  version is in-memory and single-process), email verification and
  password reset, enforcing the `admin`/`viewer` role that's already
  modeled but not yet checked anywhere, and hooking retries into
  Razorpay's saved-card/recurring-charge API so a retry can complete
  without the customer re-entering card details.

## Running it locally

1. Copy `.env.example` to `.env`:
   - `DATABASE_URL` — any Postgres connection string (Neon, Supabase,
     Railway — interchangeable, plain Prisma underneath)
   - `REDIS_URL` — Upstash, must use `rediss://` (TLS)
   - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Razorpay Dashboard,
     Test Mode, Settings → API Keys
   - `GEMINI_API_KEY` — aistudio.google.com
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `NEXTAUTH_URL` — `http://localhost:3000` locally

2. `npm install`
3. `npm run prisma:generate && npm run prisma:push`
4. `npm run dev`
5. Sign up on `/signup`, generate an API key from the dashboard
6. In separate terminals: `npm run worker` and `npm run scheduler`
7. `export SEED_API_KEY="your_key" && npm run seed 150`

## Deployment

Vercel for the Next.js app, Railway/Render for the worker and scheduler
(long-running processes, won't run on serverless functions), Neon or
Supabase for Postgres, Upstash for Redis — managed infrastructure
chosen deliberately to spend limited build time on product logic rather
than ops, with an architecture decoupled enough that moving to
self-managed infrastructure later is a config change, not a rewrite.
