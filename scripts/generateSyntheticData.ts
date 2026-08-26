import "dotenv/config";

// Weighted mix of decline codes, roughly reflecting real-world subscription
// payment failure distributions: soft declines are the most common,
// followed by auth failures, then hard declines and risk blocks.
const DECLINE_CODES: { code: string; message: string; weight: number }[] = [
  { code: "insufficient_funds", message: "Insufficient funds in account", weight: 30 },
  { code: "bank_temporarily_unavailable", message: "Bank system temporarily unavailable", weight: 10 },
  { code: "issuer_timeout", message: "Issuer did not respond in time", weight: 8 },

  { code: "card_expired", message: "Card has expired", weight: 15 },
  { code: "account_closed", message: "Account is closed", weight: 5 },
  { code: "card_reported_lost_or_stolen", message: "Card reported lost or stolen", weight: 3 },
  { code: "invalid_card", message: "Invalid card number", weight: 4 },

  { code: "authentication_timeout", message: "3DS authentication timed out", weight: 12 },
  { code: "otp_not_entered", message: "OTP not entered in time", weight: 8 },
  { code: "three_ds_failed", message: "3DS authentication failed", weight: 3 },

  { code: "suspected_fraud", message: "Issuer flagged transaction as suspected fraud", weight: 2 },
];

function weightedPick<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    if (r < item.weight) return item;
    r -= item.weight;
  }
  return items[items.length - 1];
}

function randomAmountPaise(): number {
  // ₹99 to ₹4999 subscription-style amounts, in paise
  const rupees = Math.floor(Math.random() * (4999 - 99) + 99);
  return rupees * 100;
}

function randomPastDate(daysBack: number): Date {
  const now = Date.now();
  const past = now - Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(past);
}

function generateBatch(count: number) {
  const transactions = [];
  for (let i = 0; i < count; i++) {
    const decline = weightedPick(DECLINE_CODES);
    transactions.push({
      externalId: `txn_${Date.now()}_${i}`,
      customerId: `cust_${Math.floor(Math.random() * 5000)}`,
      subscriptionId: `sub_${Math.floor(Math.random() * 2000)}`,
      amountPaise: randomAmountPaise(),
      declineCode: decline.code,
      declineMessage: decline.message,
      attemptNumber: 1,
      originalFailedAt: randomPastDate(14).toISOString(),
    });
  }
  return transactions;
}

async function main() {
  const count = Number(process.argv[2] ?? 150);
  const apiKey = process.env.SEED_API_KEY;

  if (!apiKey) {
    console.error(
      "Missing SEED_API_KEY. Generate one from the dashboard (API keys panel) " +
      "and set SEED_API_KEY=rcv_test_... in your .env before seeding."
    );
    process.exit(1);
  }

  const batch = generateBatch(count);
  const apiUrl = process.env.SEED_TARGET_URL ?? "http://localhost:3000/api/ingest";

  console.log(`Posting ${batch.length} synthetic transactions to ${apiUrl}...`);

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ transactions: batch }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error("Seed failed:", json);
    process.exit(1);
  }
  console.log(`Done. Ingested: ${json.ingested}`);
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
