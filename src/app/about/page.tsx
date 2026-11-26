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

export default function About() {
  return (
    <Shell title="About Recoverly">
      <p>Recoverly helps subscription businesses understand why their payments fail and win back the ones that can be saved.</p>
      <h2>Why it exists</h2>
      <p>A failed charge is not a customer who chose to leave. It is often an expired card, a bank hiccup or a missed approval, and a lot of that revenue can be recovered if the right thing is done at the right time. Most small businesses never see why their payments fail, let alone fix it.</p>
      <h2>How we work</h2>
      <ul>
        <li><b>We never touch your money.</b> Your payment gateway charges and settles. We only read failures and decide the next step.</li>
        <li><b>Insights first.</b> You can see why payments fail before you rely on anything else.</li>
        <li><b>Privacy by design.</b> Only the decline code, message and amount are analysed. Customer details are not sent to the AI.</li>
        <li><b>Honest about limits.</b> Where something is simulated or not built yet, we say so.</li>
      </ul>
      <h2>Who is behind it</h2>
      <p>Recoverly is built and run by Hanshal Gajula, based in India.</p>
      <p>LinkedIn: <a href="https://www.linkedin.com/in/hanshal-gajula" target="_blank" rel="noopener noreferrer">linkedin.com/in/hanshal-gajula</a></p>
      <h2>Get in touch</h2>
      <p>Questions, feedback or ideas: <a href="mailto:support.devtrials@gmail.com">support.devtrials@gmail.com</a></p>
    </Shell>
  );
}
