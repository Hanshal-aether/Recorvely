"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";

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
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, email: cleanEmail, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Server problem, please try again in a moment.");
        setLoading(false);
        return;
      }
      const signInRes = await signIn("credentials", { email: cleanEmail, password, redirect: false });
      setLoading(false);
      router.push(signInRes?.error ? "/login" : "/dashboard");
    } catch {
      setError("Network problem, please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      sub="Start recovering failed payments in minutes."
      footer={<>Already have an account? <Link href="/login">Log in</Link></>}
    >
      <form onSubmit={handleSubmit}>
        <div>
          <label>Company name</label>
          <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" autoCapitalize="none" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password (min 8 characters)</label>
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        {error && <p className="err">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
      </form>
    </AuthShell>
  );
}
