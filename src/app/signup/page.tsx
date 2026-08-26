"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, email, password }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    // Signup creates the account; log straight in afterward so the user
    // doesn't have to fill the form twice.
    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 380, paddingTop: 100 }}>
      <p className="eyebrow">Recoverly</p>
      <h1>Create your account</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <input
          type="text"
          placeholder="Company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          style={inputStyle}
        />
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
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={inputStyle}
        />
        {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 16 }}>
        Already have an account? <Link href="/login" style={{ color: "var(--accent)" }}>Log in</Link>
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
