import Link from "next/link";

const steps = [
  { n: "01", t: "Ingest", d: "Your Razorpay webhook or our API sends every failed payment in real time.", c: "#FFD93B" },
  { n: "02", t: "Classify", d: "Rules read the decline code first. The AI only sees code, message and amount. Never customer data.", c: "#22E39B" },
  { n: "03", t: "Decide", d: "Soft declines get scheduled retries. Hard declines ask the customer to update their card.", c: "#D9D2EE" },
  { n: "04", t: "Recover", d: "Every step lands in an audit trail you can read like a timeline.", c: "#FFFFFF" },
];

const feats = [
  ["Retry policy engine", "Soft decline, hard decline, auth failure, risk block. Each has its own playbook and a hard stop after 3 attempts."],
  ["Zero-PII AI", "One swappable interface. Change the model without touching business logic."],
  ["Revocable API keys", "Hashed, shown once, revoked in one click. Revoked keys stop ingesting instantly."],
  ["Multi-tenant", "Every query is scoped to a merchant. No cross-account leaks."],
];

const faqs = [
  ["What is Recoverly in one line?", "It watches your failed subscription payments, works out why each one failed, and decides the right next step: retry later, ask the customer to update their card, or flag it for a human."],
  ["How is this different from Razorpay's own retries?", "Gateway retries follow a fixed schedule. Recoverly reads the decline reason first, so a temporary bank hiccup gets retried, while a stolen or expired card is not hammered again and the customer is asked to update instead. Every decision is explained in an audit trail."],
  ["How do I connect it?", "Sign up, create an API key in the dashboard, and send each failed payment (decline code, message, amount) to the ingest endpoint from your backend or Razorpay webhook. No checkout changes are needed."],
  ["Do I need to change my checkout or my customers' experience?", "No. Recoverly sits behind your payment flow. Your customers only notice that fewer of their subscriptions lapse."],
  ["What does it cost?", "It is free while in early access. Pricing for larger merchants will be announced later, and it is designed to cost less than the revenue it recovers."],
  ["Does Recoverly see card numbers or customer details?", "No. It only needs the decline code, the gateway message and the amount. The AI model never receives names, emails, card numbers or phone numbers."],
  ["Is my data safe?", "Passwords and API keys are stored hashed, every query is scoped to your own account, and every action is written to an append-only audit trail."],
  ["Which kinds of failures does it handle?", "Soft declines (like insufficient funds or bank timeouts), hard declines (like expired or blocked cards), authentication failures, and risk blocks. Each one has its own playbook."],
  ["How many times will it retry a payment?", "At most 3 attempts. After that it stops and escalates, so your customer's bank is never spammed."],
  ["What happens when a card is permanently dead?", "Recoverly does not keep retrying. It marks the payment to escalate so the customer is asked to update their payment method."],
  ["Can I turn off or revoke access?", "Yes. You can revoke any API key in one click and it stops ingesting immediately."],
  ["Can I use a different AI model?", "Yes. The model sits behind one swappable interface, so you can change providers without touching your payment logic."],
  ["Is the retry real?", "Order creation runs in Razorpay test mode. Retry completion is simulated and flagged simulated: true. Real saved-card charges are the next milestone."],
  ["Is it ready for production?", "It is an early product. The pipeline, audit trail and security basics are in place, but live recurring charges are still being built, so treat it as a preview."],
  ["Does it work with gateways other than Razorpay?", "Right now it is built around Razorpay. The decision engine is gateway-independent, so more gateways are possible later."],
  ["Can my team use it together?", "Each account has an admin login today. Inviting teammates with roles is on the roadmap."],
  ["Who is it for?", "Any Razorpay merchant with monthly subscriptions losing customers to failed charges."],
];

const Cloud = ({ style }: { style: React.CSSProperties }) => (
  <svg viewBox="0 0 200 90" style={{ position: "absolute", ...style }} aria-hidden>
    <path d="M10 80 C0 80 0 62 16 60 C14 40 40 34 52 46 C58 22 96 18 106 42 C122 30 150 40 146 60 C168 56 186 70 176 80 Z" fill="#EFE8C5" />
  </svg>
);

export default function Home() {
  return (
    <main className="rc">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Outfit:wght@400;500;600;700&display=swap');
        .rc{--ink:#1B1633;--blue:#0057E7;--yel:#FFD93B;--grn:#22E39B;--lav:#D9D2EE;--cream:#FFF4CC;
          background:#fff;color:var(--ink);font-family:Outfit,system-ui,sans-serif;min-height:100vh;padding:24px 16px 60px}
        .rc *{box-sizing:border-box}
        .rc a{color:inherit;text-decoration:none}
        .rc .w{max-width:1120px;margin:0 auto}
        .rc .hd{font-family:'Bricolage Grotesque',Outfit,sans-serif}
        .rc .bar{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
        .rc .logo{font-weight:800;font-size:22px}
        .rc .btn{display:inline-block;border:2.5px solid var(--ink);border-radius:14px;padding:11px 20px;font-weight:700;font-size:16px;
          background:#fff;box-shadow:4px 4px 0 var(--ink);transition:.12s;text-align:center}
        .rc .btn:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 var(--ink)}
        .rc .btn.b{background:var(--blue);color:#fff}
        .rc .btn.y{background:var(--yel)}
        .rc .hero{position:relative;background:var(--blue);border:2.5px solid var(--ink);border-radius:40px;box-shadow:8px 8px 0 var(--ink);
          padding:64px 24px 130px;text-align:center;color:#fff;overflow:hidden}
        .rc h1.hd{color:#fff !important}
        .rc h1{font-size:clamp(56px,11vw,128px);line-height:.95;letter-spacing:-.04em;margin:0;font-weight:800;text-shadow:5px 5px 0 var(--ink)}
        .rc .star{position:absolute;top:42px;right:calc(50% - 330px);font-size:56px;color:var(--yel);text-shadow:none}
        .rc .tagl{color:var(--yel);font-size:clamp(22px,3.5vw,32px);font-weight:700;margin:26px 0 14px}
        .rc .lead{max-width:760px;margin:0 auto 26px;font-size:clamp(16px,2vw,20px);line-height:1.8;font-weight:500}
        .rc .chips{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;position:relative;z-index:2}
        .rc .chip{border:2.5px solid var(--ink);border-radius:999px;padding:8px 20px;font-weight:600;font-size:17px;color:var(--ink);box-shadow:3px 3px 0 var(--ink)}
        .rc .panel{position:relative;z-index:3;background:#fff;border:2.5px solid var(--ink);border-radius:32px;box-shadow:6px 6px 0 var(--ink);
          max-width:1020px;margin:-92px auto 0;padding:28px 32px}
        .rc .row{display:flex;gap:22px;align-items:center;flex-wrap:wrap}
        .rc .mascot{width:84px;height:84px;flex:none}
        .rc .badge{display:inline-block;background:var(--yel);border:2px solid var(--ink);border-radius:999px;padding:3px 14px;font-weight:700;font-size:14px;margin-bottom:8px}
        .rc .pt{font-size:clamp(22px,3vw,30px);font-weight:700;margin:0}
        .rc .pt small{color:#7a7690;font-size:.7em;margin-right:8px;font-family:Outfit}
        .rc .meta{color:#6b6785;font-weight:500;margin-top:6px}
        .rc .acts{margin-left:auto;display:flex;flex-direction:column;gap:12px;min-width:250px}
        .rc .dash{border-top:2px dashed #c9c6d6;margin:22px 0 18px}
        .rc .prog{display:flex;align-items:center;gap:14px;font-weight:600;color:#55516e}
        .rc .track{flex:1;height:16px;border:2.5px solid var(--ink);border-radius:999px;background:#fff;overflow:hidden}
        .rc .track i{display:block;height:100%;width:6%;background:var(--grn);border-right:2.5px solid var(--ink)}
        .rc h2{font-size:clamp(34px,5vw,56px);letter-spacing:-.03em;margin:80px 0 28px;font-weight:800;text-align:center}
        .rc .g{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
        .rc .card{border:2.5px solid var(--ink);border-radius:28px;box-shadow:6px 6px 0 var(--ink);padding:26px;transition:.15s;background:#fff}
        .rc .card:hover{transform:translate(3px,3px);box-shadow:3px 3px 0 var(--ink)}
        .rc .card .n{display:inline-block;border:2px solid var(--ink);border-radius:999px;background:#fff;padding:2px 12px;font-weight:700;margin-bottom:34px}
        .rc .card h3{font-size:26px;margin:0 0 8px;font-weight:800}
        .rc .card p{margin:0;line-height:1.6;font-weight:500;color:#3a3556}
        .rc .honest{border:2.5px dashed var(--ink);border-radius:28px;background:var(--cream);padding:28px;line-height:1.7;font-weight:500;font-size:18px;max-width:900px;margin:0 auto}
        .rc details{border:2.5px solid var(--ink);border-radius:20px;background:#fff;box-shadow:4px 4px 0 var(--ink);padding:18px 22px;margin:0 auto 16px;max-width:820px}
        .rc summary{cursor:pointer;font-weight:700;font-size:20px;list-style:none;display:flex;justify-content:space-between}
        .rc summary::after{content:"+";font-size:26px;line-height:1}
        .rc details[open] summary::after{content:"–"}
        .rc details p{margin:12px 0 0;line-height:1.6;font-weight:500;color:#3a3556}
        .rc .final{background:var(--yel);border:2.5px solid var(--ink);border-radius:40px;box-shadow:8px 8px 0 var(--ink);text-align:center;padding:56px 20px;margin-top:80px}
        .rc .final h2{margin:0 0 24px}
        .rc footer{text-align:center;margin-top:40px;font-weight:500;color:#6b6785}
        @keyframes bob{50%{transform:translateY(-8px) rotate(-3deg)}}
        .rc .mascot{animation:bob 2.4s ease-in-out infinite}
        @media(max-width:700px){.rc .acts{margin-left:0;width:100%}.rc .star{display:none}.rc .panel{padding:22px}}
      `}</style>

      <div className="w">
        <div className="bar">
          <div className="logo hd" style={{ display: "flex", alignItems: "center" }}><svg width="34" height="34" viewBox="0 0 64 64" style={{ marginRight: 10 }} aria-hidden><rect x="7" y="7" width="54" height="54" rx="15" fill="#1B1633"/><rect x="3" y="3" width="54" height="54" rx="15" fill="#0057E7" stroke="#1B1633" strokeWidth="4"/><path d="M42 22 A14 14 0 1 0 44 34" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round"/><path d="M33 12 L47 22 L34 30 Z" fill="#FFD93B" stroke="#1B1633" strokeWidth="2.5" strokeLinejoin="round"/><circle cx="30" cy="30" r="5.5" fill="#FFD93B" stroke="#1B1633" strokeWidth="2.5"/></svg>Recoverly</div>
          <div style={{ display: "flex", gap: 12 }}>
            <Link className="btn" href="/login">Log in</Link>
            <Link className="btn b" href="/signup">Sign up</Link>
          </div>
        </div>

        <section className="hero">
          <Cloud style={{ left: -30, bottom: 60, width: 260 }} />
          <Cloud style={{ right: 40, top: 30, width: 190 }} />
          <Cloud style={{ right: -40, bottom: 70, width: 300 }} />
          <h1 className="hd">Recoverly</h1>
          <span className="star">✸</span>
          <div className="tagl hd">Win back failed payments</div>
          <p className="lead">Your customer didn&apos;t leave. Their card did. Recoverly classifies every failed subscription payment, picks the right retry, and keeps a full audit trail. No customer data ever reaches the AI.</p>
          <div className="chips">
            <span className="chip" style={{ background: "#fff" }}>4 steps</span>
            <span className="chip" style={{ background: "var(--grn)" }}>0 PII to AI</span>
            <span className="chip" style={{ background: "var(--yel)" }}>3 retries max</span>
            <span className="chip" style={{ background: "var(--lav)" }}>Full audit trail</span>
          </div>
        </section>

        <div className="panel">
          <div className="row">
            <svg className="mascot" viewBox="0 0 84 84" aria-hidden>
              <rect x="8" y="14" width="68" height="46" rx="10" fill="#FFE500" stroke="#1B1633" strokeWidth="3" />
              <rect x="8" y="26" width="68" height="9" fill="#1B1633" />
              <rect x="18" y="45" width="22" height="6" rx="3" fill="#1B1633" />
              <path d="M26 60 v10 h-8 M58 60 v10 h8" stroke="#1B1633" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
            <div>
              <span className="badge">Start here</span>
              <h3 className="pt hd"><small>01.01</small>Recover your first failed payment</h3>
              <div className="meta">Step 1 · Connect your Razorpay account · 2 min</div>
            </div>
            <div className="acts">
              <Link className="btn b" href="/signup">Get started free</Link>
              <a className="btn" href="#how">How it works</a>
            </div>
          </div>
          <div className="dash" />
          <div className="prog">
            <span>0 of 4 steps done</span>
            <div className="track"><i /></div>
          </div>
        </div>

        <h2 id="how" className="hd">How it works</h2>
        <div className="g">
          {steps.map((s) => (
            <div className="card" key={s.n} style={{ background: s.c }}>
              <span className="n">{s.n}</span>
              <h3 className="hd">{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>

        <h2 className="hd">Built like a real product</h2>
        <div className="g">
          {feats.map(([t, d]) => (
            <div className="card" key={t}>
              <h3 className="hd">{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>

        <h2 className="hd">What this honestly doesn&apos;t do</h2>
        <div className="honest">
          <b>Retry completion is simulated today.</b> Order creation runs against Razorpay test mode and the final charge is flagged <b>simulated: true</b>. Real saved-card recurring charges are next on the roadmap.
        </div>

        <h2 className="hd">Questions</h2>
        {faqs.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}

        <div className="final">
          <h2 className="hd">Stop losing customers to failed cards.</h2>
          <Link className="btn b" href="/signup" style={{ fontSize: 20, padding: "14px 30px" }}>Get started free</Link>
        </div>

        <footer>© 2026 Recoverly</footer>
      </div>
    </main>
  );
}
