import Link from "next/link";

function Shell({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <main className="lg">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Outfit:wght@400;500;600;700&display=swap');
        .lg{--ink:#1B1633;min-height:100vh;background:#0057E7;padding:28px 16px 60px;font-family:Outfit,system-ui,sans-serif;color:var(--ink)}
        .lg *{box-sizing:border-box}
        .lg a{color:#0057E7;font-weight:600}
        .lg .top{max-width:820px;margin:0 auto 22px;display:flex;justify-content:space-between;align-items:center}
        .lg .logo{font-family:'Bricolage Grotesque',Outfit,sans-serif;font-weight:800;font-size:28px;color:#fff;text-shadow:3px 3px 0 var(--ink);text-decoration:none}
        .lg .back{color:#fff;text-decoration:underline}
        .lg .card{max-width:820px;margin:0 auto;background:#fff;border:2.5px solid var(--ink);border-radius:28px;box-shadow:7px 7px 0 var(--ink);padding:clamp(22px,4vw,44px)}
        .lg h1{font-family:'Bricolage Grotesque',Outfit,sans-serif;font-size:clamp(34px,6vw,52px);letter-spacing:-.03em;margin:0 0 6px;font-weight:800;color:var(--ink)}
        .lg h2{font-family:'Bricolage Grotesque',Outfit,sans-serif;font-size:22px;margin:30px 0 8px;font-weight:800;color:var(--ink)}
        .lg p,.lg li{line-height:1.7;font-weight:500;color:#3a3556;font-size:17px}
        .lg ul{padding-left:22px;margin:8px 0}
        .lg .upd{color:#6b6785;font-weight:600;margin:0 0 10px}
        .lg footer{max-width:820px;margin:22px auto 0;text-align:center;color:#fff;font-weight:600;display:flex;gap:20px;justify-content:center;flex-wrap:wrap}
        .lg footer a{color:#fff}
      `}</style>
      <div className="top">
        <Link href="/" className="logo">Recoverly</Link>
        <Link href="/" className="back">← Back home</Link>
      </div>
      <div className="card">
        <h1>{title}</h1>
        {updated && <p className="upd">Last updated: {updated}</p>}
        {children}
      </div>
      <footer>
        <Link href="/about">About</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <a href="mailto:support.devtrials@gmail.com">Contact</a>
      </footer>
    </main>
  );
}

export const metadata = { title: "Privacy Policy | Recoverly" };

export default function Privacy() {
  return (
    <Shell title="Privacy Policy" updated="26 November 2026">
      <p>This policy explains what Recoverly collects, why, and your choices. Recoverly is operated by Hanshal Gajula, India. Contact: <a href="mailto:support.devtrials@gmail.com">support.devtrials@gmail.com</a>.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Account details:</b> your company name, email address and a hashed password. We never store your password in readable form.</li>
        <li><b>API keys:</b> only a hash and a short prefix. The full key is shown once when you create it.</li>
        <li><b>Payment failure records you send us:</b> decline code, gateway message, amount, timestamps, and the transaction or subscription reference you choose to include.</li>
        <li><b>Activity records:</b> an audit trail of classifications, decisions and retry attempts for your account.</li>
        <li><b>Technical logs:</b> standard server logs such as IP address and request time, used for security and fixing errors.</li>
      </ul>
      <p>We do not want card numbers, CVVs, bank details or customer names. Please do not send them.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To run the service: classify failures, decide next steps and show your dashboard.</li>
        <li>To keep the service secure and prevent abuse.</li>
        <li>To contact you about your account or the service.</li>
      </ul>

      <h2>AI processing</h2>
      <p>When a failure cannot be classified by our rules, only the decline code, the gateway message and the amount are sent to an AI model provider. No names, emails, phone numbers or card details are sent. We do not use your data to train third-party models.</p>

      <h2>Who handles your data</h2>
      <p>We manage your data ourselves and run Recoverly on trusted infrastructure and service providers, who process it only to provide their services to us. If you would like to know which providers handle your data, email us at <a href="mailto:support.devtrials@gmail.com">support.devtrials@gmail.com</a> and we will tell you.</p>

      <h2>Cookies and local storage</h2>
      <p>We use a secure session cookie to keep you logged in. We also store a small note in your browser (local storage) to remember which setup steps you have completed. We do not use advertising trackers.</p>

      <h2>How long we keep data</h2>
      <p>We keep your data while your account is active. If you close your account or ask us to delete it, we delete it within 30 days, except for limited records we must keep for security or legal reasons.</p>

      <h2>Your choices</h2>
      <p>You can ask to access, correct or delete your data, or close your account, by emailing <a href="mailto:support.devtrials@gmail.com">support.devtrials@gmail.com</a>. You can revoke any API key at any time from your dashboard.</p>

      <h2>Security</h2>
      <p>Passwords and API keys are stored hashed, connections use HTTPS, and every query is limited to your own account. No system is perfectly secure, and we will tell affected users if a breach that affects them occurs.</p>

      <h2>Children</h2>
      <p>Recoverly is for businesses and is not intended for anyone under 18.</p>

      <h2>Changes</h2>
      <p>If we change this policy, we will update the date above and, for significant changes, tell account holders by email.</p>
    </Shell>
  );
}
