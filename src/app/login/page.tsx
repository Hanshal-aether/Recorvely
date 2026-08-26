"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", { email, password, redirect: false });

    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 380, paddingTop: 100 }}>
      <p className="eyebrow">Recoverly</p>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 16 }}>
        No account? <Link href="/signup" style={{ color: "var(--accent)" }}>Sign up</Link>
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 12px",
  color: "var(--text)",
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  background: "var(--accent)",
  color: "#0E1512",
  border: "none",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
