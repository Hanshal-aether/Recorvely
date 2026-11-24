"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function AuthShell({ title, sub, children, footer }: { title: string; sub: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <main className="au">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Outfit:wght@400;500;600;700&display=swap');
        .au{--ink:#1B1633;min-height:100vh;background:#0057E7;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;font-family:Outfit,system-ui,sans-serif;color:var(--ink);position:relative;overflow:hidden}
        .au *{box-sizing:border-box}
        .au a{text-decoration:none;color:inherit}
        .au .logo{font-family:'Bricolage Grotesque',Outfit,sans-serif;font-weight:800;font-size:clamp(44px,9vw,72px);letter-spacing:-.04em;color:#fff;text-shadow:4px 4px 0 var(--ink);margin-bottom:22px;line-height:1}
        .au .card{width:100%;max-width:440px;background:#fff;border:2.5px solid var(--ink);border-radius:28px;box-shadow:7px 7px 0 var(--ink);padding:30px;position:relative;z-index:2}
        .au h1{font-family:'Bricolage Grotesque',Outfit,sans-serif;font-size:32px;margin:0 0 4px;font-weight:800;letter-spacing:-.02em;color:var(--ink)}
        .au .sub{margin:0 0 22px;color:#6b6785;font-weight:500}
        .au form{display:flex;flex-direction:column;gap:14px}
        .au label{font-weight:600;font-size:14px;display:block;margin-bottom:6px}
        .au input{width:100%;border:2.5px solid var(--ink);border-radius:14px;padding:12px 14px;font-size:16px;font-family:inherit;background:#fff;color:var(--ink);outline:none}
        .au input:focus{box-shadow:3px 3px 0 #FFD93B}
        .au button{border:2.5px solid var(--ink);border-radius:14px;background:#FFD93B;color:var(--ink);font-weight:700;font-size:17px;padding:13px;cursor:pointer;box-shadow:4px 4px 0 var(--ink);font-family:inherit;transition:.12s;margin-top:4px}
        .au button:hover:not(:disabled){transform:translate(2px,2px);box-shadow:2px 2px 0 var(--ink)}
        .au button:disabled{opacity:.6;cursor:wait}
        .au .err{background:#FFE1E1;border:2px solid var(--ink);border-radius:12px;padding:10px 12px;font-weight:600;font-size:14px;margin:0}
        .au .foot{margin-top:18px;font-weight:500;color:#55516e}
        .au .foot a{font-weight:700;color:#0057E7;text-decoration:underline}
        .au .cl{position:absolute;opacity:.95}
      `}</style>
      <svg className="cl" viewBox="0 0 200 90" style={{ left: -40, bottom: 20, width: 280 }} aria-hidden><path d="M10 80 C0 80 0 62 16 60 C14 40 40 34 52 46 C58 22 96 18 106 42 C122 30 150 40 146 60 C168 56 186 70 176 80 Z" fill="#EFE8C5" /></svg>
      <svg className="cl" viewBox="0 0 200 90" style={{ right: -30, top: 40, width: 220 }} aria-hidden><path d="M10 80 C0 80 0 62 16 60 C14 40 40 34 52 46 C58 22 96 18 106 42 C122 30 150 40 146 60 C168 56 186 70 176 80 Z" fill="#EFE8C5" /></svg>
      <Link href="/" className="logo">Recoverly</Link>
      <div className="card">
        <h1>{title}</h1>
        <p className="sub">{sub}</p>
        {children}
        <p className="foot">{footer}</p>
      </div>
    </main>
  );
}

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