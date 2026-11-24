"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";

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
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError(
          res.error === "CredentialsSignin"
            ? "Wrong email or password."
            : "Server problem, please try again in a moment."
        );
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Network problem, please try again.");
    }
    setLoading(false);
  }

  return (
    <AuthShell
      title="Welcome back"
      sub="Log in to your recovery dashboard."
      footer={<>No account? <Link href="/signup">Sign up</Link></>}
    >
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input type="email" autoCapitalize="none" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="err">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
      </form>
    </AuthShell>
  );
}
