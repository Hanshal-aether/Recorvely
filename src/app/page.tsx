import Link from "next/link";

export default function Home() {
  return (
    <div className="container" style={{ paddingTop: 100, textAlign: "center" }}>
      <p className="eyebrow">Recoverly</p>
      <h1>Payment recovery engine</h1>
      <p className="subtitle">
        Classifies failed payments, decides the right recovery action, executes it,
        and proves it with real numbers.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Link
          href="/login"
          style={{
            border: "1px solid var(--border)",
            color: "var(--text)",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          style={{
            background: "var(--accent)",
            color: "#0E1512",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
