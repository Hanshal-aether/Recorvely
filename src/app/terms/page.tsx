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

export const metadata = { title: "Terms of Service | Recoverly" };

export default function Terms() {
  return (
    <Shell title="Terms of Service" updated="26 November 2026">
      <p>By creating an account or using Recoverly, you agree to these terms. Recoverly is operated by Hanshal Gajula, India. Contact: <a href="mailto:support.devtrials@gmail.com">support.devtrials@gmail.com</a>.</p>

      <h2>The service</h2>
      <p>Recoverly analyses failed subscription payments you send to it, classifies the cause and recommends or schedules a next step. Recoverly does not process, hold or move money. Charges and settlements happen only through your own payment gateway.</p>

      <h2>Early access</h2>
      <p>Recoverly is in early access and is free to use for now. Some features are simulated or still being built. For example, retry completion is currently simulated and marked as such. Features may change, and we may introduce paid plans in the future with advance notice.</p>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate information and keep your login and API keys secret. You are responsible for activity under your account.</li>
        <li>You must be at least 18 and authorised to act for the business you register.</li>
        <li>Tell us promptly if you think your account or keys have been compromised.</li>
      </ul>

      <h2>Your responsibilities</h2>
      <ul>
        <li>You are responsible for following the rules of your payment gateway, card networks and banks, and applicable law, including rules on retrying payments and on recurring payment authorisations and notices.</li>
        <li>You must have the right to send us the data you submit, and you must not send card numbers, CVVs or other sensitive payment credentials.</li>
        <li>You decide whether and how to contact your customers. Recoverly's recommendations are not legal or financial advice.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Do not misuse the service: no attempts to break or overload it, access other accounts, reverse engineer it, or use it for fraud or anything unlawful. We may suspend or close accounts that do.</p>

      <h2>Your data</h2>
      <p>You keep ownership of the data you send. You give us permission to process it to provide the service, as described in our <Link href="/privacy">Privacy Policy</Link>.</p>

      <h2>No guarantees</h2>
      <p>Recoverly is provided "as is" and "as available". We do not promise that any payment will be recovered, that the service will be uninterrupted or error-free, or that classifications will always be correct.</p>

      <h2>Limit of liability</h2>
      <p>To the extent permitted by law, we are not liable for indirect or consequential losses, lost revenue or lost profits arising from use of the service. Our total liability for any claim is limited to the amount you paid us in the 12 months before the claim, which for free use is zero.</p>

      <h2>Ending your use</h2>
      <p>You can stop using Recoverly and ask us to delete your account at any time. We may suspend or end the service or your access, with notice where reasonable.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India. Any dispute is subject to the courts of India.</p>

      <h2>Changes</h2>
      <p>We may update these terms. Continued use after an update means you accept the new terms.</p>
    </Shell>
  );
}
