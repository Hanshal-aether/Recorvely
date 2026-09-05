import Link from "next/link";

export default function Home() {
  return (
    <div className="hero-gradient">
      <div className="container" style={{ paddingTop: 110, paddingBottom: 60 }}>
        {/* Hero */}
        <p className="eyebrow fade-in" style={{ textAlign: "center" }}>Recoverly</p>
        <h1
          className="fade-in fade-in-delay-1"
          style={{ fontSize: 44, textAlign: "center", maxWidth: 760, margin: "0 auto 18px", lineHeight: 1.15 }}
        >
          Your customer didn't leave.
          <br />
          Their card did.
        </h1>
        <p
          className="subtitle fade-in fade-in-delay-2"
          style={{ maxWidth: 580, margin: "0 auto 10px", textAlign: "center", fontSize: 17 }}
        >
          A payment just failed — not because someone quit, but because a card expired, a bank
          blipped, or an auth step timed out. Recoverly figures out which one it was, picks the
          right response, and knows when to stop trying.
        </p>
        <p
          className="fade-in fade-in-delay-2"
          style={{ textAlign: "center", fontSize: 13, color: "var(--text-dim)", marginBottom: 40 }}
        >
          Built for Razorpay's Buildathon — Track 3, AI Revenue Recovery
        </p>
        <div
          className="fade-in fade-in-delay-3"
          style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 96 }}
        >
          <Link href="/login" className="btn-secondary" style={{ textDecoration: "none", padding: "11px 22px", fontSize: 14 }}>
            Log in
          </Link>
          <Link href="/signup" className="btn-primary" style={{ textDecoration: "none", padding: "11px 22px", fontSize: 14 }}>
            Sign up
          </Link>
        </div>

        {/* How it works */}
        <p
          className="fade-in"
          style={{
            textAlign: "center",
            color: "var(--accent)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          How it works
        </p>
        <h2
          className="fade-in"
          style={{
            textAlign: "center",
            fontSize: 26,
            fontWeight: 600,
            color: "var(--text)",
            maxWidth: 520,
            margin: "0 auto 36px",
          }}
        >
          Three decisions, made for every single failure
        </h2>
        <div
          className="fade-in fade-in-delay-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
            maxWidth: 920,
            margin: "0 auto 100px",
          }}
        >
          <HowItWorksStep number="1" title="See why it failed" body="Not just 'declined' — the actual reason, sorted into a category that tells us how to respond." delay={0} />
          <HowItWorksStep number="2" title="Pick the right response" body="A dead card never gets blind-retried. A temporary blip gets a real second chance, on a schedule." delay={0.15} />
          <HowItWorksStep number="3" title="Know when to stop" body="After enough failed attempts, it stops and hands off instead of retrying forever." delay={0.3} />
        </div>

        {/* How a merchant integrates */}
        <div style={{ maxWidth: 820, margin: "0 auto 96px" }}>
          <p
            className="fade-in"
            style={{
              textAlign: "center",
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Integration
          </p>
          <h2
            className="fade-in"
            style={{ textAlign: "center", fontSize: 26, fontWeight: 600, color: "var(--text)", marginBottom: 40 }}
          >
            How a Razorpay merchant actually plugs this in
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <IntegrationRow
              n="1"
              title="Automatic, not manual"
              text="Their backend sends failed-payment events to our ingestion API the moment they happen — no CLI, no human clicking anything, the same shape as any webhook integration."
              last={false}
            />
            <IntegrationRow
              n="2"
              title="Isolated by design"
              text="Every merchant gets its own account and a revocable API key, never a shared password — isolation enforced at the database level, not just the interface."
              last={false}
            />
            <IntegrationRow
              n="3"
              title="Transparent, not a black box"
              text="Their finance and ops team watches the dashboard: what got recovered, what got escalated, and exactly why — in plain language, not raw logs."
              last={true}
            />
          </div>
        </div>

        {/* Honesty */}
        <div
          className="fade-in-up"
          style={{
            maxWidth: 640,
            margin: "0 auto",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderTop: "3px solid var(--accent)",
            borderRadius: 16,
            padding: "28px 34px",
            boxShadow: "var(--shadow)",
          }}
        >
          <p className="section-title" style={{ marginBottom: 14 }}>
            What this honestly doesn't do
          </p>
          <ul style={{ margin: 0, paddingLeft: 20, color: "var(--text-dim)", fontSize: 14, lineHeight: 1.8 }}>
            <li>It can't make a card work again — a genuinely dead card stays dead, on purpose.</li>
            <li>It doesn't complete a retry without a real customer entering real card details.</li>
            <li>It won't guess when it isn't confident — an unclear case gets a human, not a shrug.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function IntegrationRow({
  n,
  title,
  text,
  last,
}: {
  n: string;
  title: string;
  text: string;
  last: boolean;
}) {
  return (
    <div
      className="lift-on-hover"
      style={{
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "22px 26px",
        boxShadow: "var(--shadow)",
        marginBottom: last ? 0 : 14,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: "50%",
          background: "var(--accent-soft)",
          color: "var(--accent)",
          fontFamily: "var(--mono)",
          fontSize: 14,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {n}
      </span>
      <div>
        <p style={{ margin: "2px 0 6px", fontWeight: 600, fontSize: 15, color: "var(--text)" }}>{title}</p>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>{text}</p>
      </div>
    </div>
  );
}

function HowItWorksStep({
  number,
  title,
  body,
  delay = 0,
}: {
  number: string;
  title: string;
  body: string;
  delay?: number;
}) {
  return (
    <div
      className="lift-on-hover fade-in-up"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 24,
        boxShadow: "var(--shadow)",
        animationDelay: `${delay}s`,
      }}
    >
      <p
        style={{
          display: "inline-block",
          fontFamily: "var(--mono)",
          fontSize: 12,
          color: "var(--accent)",
          fontWeight: 700,
          background: "var(--accent-soft)",
          borderRadius: 999,
          padding: "3px 10px",
          marginBottom: 12,
        }}
      >
        {number}
      </p>
      <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: "var(--text)" }}>{title}</p>
      <p style={{ fontSize: 13.5, color: "var(--text-dim)", margin: 0, lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}
