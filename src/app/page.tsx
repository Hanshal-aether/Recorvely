import Link from "next/link";

export default function Home() {
  return (
    <div className="hero-gradient">
      <div className="container" style={{ paddingTop: 100, paddingBottom: 60 }}>
        <p className="eyebrow fade-in" style={{ textAlign: "center" }}>Recoverly</p>
        <h1 className="fade-in fade-in-delay-1" style={{ fontSize: 40, textAlign: "center", maxWidth: 720, margin: "0 auto 16px" }}>
          Your customer didn't leave. Their card did.
        </h1>
        <p
          className="subtitle fade-in fade-in-delay-2"
          style={{ maxWidth: 560, margin: "0 auto 36px", textAlign: "center", fontSize: 16 }}
        >
          A payment just failed — not because someone quit, but because a card expired, a bank
          blipped, or an auth step timed out. Recoverly figures out which one it was, picks the
          right response, and knows when to stop trying.
        </p>
        <div className="fade-in fade-in-delay-3" style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 72 }}>
          <Link
            href="/login"
            className="btn-secondary"
            style={{ textDecoration: "none", padding: "10px 20px", fontSize: 14 }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="btn-primary"
            style={{ textDecoration: "none", padding: "10px 20px", fontSize: 14 }}
          >
            Sign up
          </Link>
        </div>

        <div
          className="fade-in fade-in-delay-4"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
            maxWidth: 900,
            margin: "0 auto 72px",
          }}
        >
          <HowItWorksStep
            number="1"
            title="See why it failed"
            body="Not just 'declined' — the actual reason, sorted into a category that tells us how to respond."
            delay={0}
          />
          <HowItWorksStep
            number="2"
            title="Pick the right response"
            body="A dead card never gets blind-retried. A temporary blip gets a real second chance, on a schedule."
            delay={0.15}
          />
          <HowItWorksStep
            number="3"
            title="Know when to stop"
            body="After enough failed attempts, it stops and hands off instead of retrying forever."
            delay={0.3}
          />
        </div>

        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "28px 32px",
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
        padding: 22,
        boxShadow: "var(--shadow)",
        animationDelay: `${delay}s`,
      }}
    >
      <p
        style={{
          fontFamily: "var(--mono)",
          fontSize: 12,
          color: "var(--accent)",
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {number}
      </p>
      <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, color: "var(--text)" }}>{title}</p>
      <p style={{ fontSize: 13, color: "var(--text-dim)", margin: 0, lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}
