"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

type Metrics = {
  totals: { total: number; recovered: number; escalated: number; exhausted: number };
  amountRecoveredPaise: number;
  recoveryRate: number;
  byCategory: { category: string; _count: { category: number } }[];
  retriesAvoided: number;
  recentAuditEvents: {
    id: string;
    transactionId: string | null;
    eventType: string;
    payload: any;
    createdAt: string;
  }[];
};

type ApiKey = {
  id: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

type ImportPreview = {
  fileName: string;
  totalRows: number;
  valid: number;
  skippedCount: number;
  skipped: { row: number; reason: string }[];
  warnings: string[];
  sample: { id: string; amountRupees: number; code: string; message: string; failedAt: string }[];
};

function ImportCard() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function send(f: File, confirm: boolean) {
    const form = new FormData();
    form.append("file", f);
    if (confirm) form.append("confirm", "1");
    const res = await fetch("/api/import", { method: "POST", body: form });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, json };
  }

  async function onPick(f: File | null) {
    setPreview(null); setError(null); setDone(null); setFile(f);
    if (!f) return;
    setBusy(true);
    const { ok, json } = await send(f, false);
    setBusy(false);
    if (!ok) { setError(json.error ?? "Could not read that file."); return; }
    setPreview(json);
  }

  async function confirmImport() {
    if (!file) return;
    setBusy(true); setError(null);
    const { ok, json } = await send(file, true);
    setBusy(false);
    if (!ok) { setError(json.error ?? "Import failed."); return; }
    setDone(
      `Imported ${json.imported} payment${json.imported === 1 ? "" : "s"}` +
        (json.alreadyImported ? `, ${json.alreadyImported} were already imported` : "") +
        ". They will appear below as they are classified."
    );
    setPreview(null); setFile(null);
  }

  function downloadTemplate() {
    const csv =
      "transaction_id,customer_id,amount,decline_code,decline_message,failed_at\n" +
      "txn_1001,cust_1,499,insufficient_funds,Insufficient funds in account,2026-11-20\n" +
      "txn_1002,cust_2,1299,card_expired,Card has expired,2026-11-21\n";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "recoverly-template.csv";
    a.click();
  }

  return (
    <>
      <p className="section-title">Import payment history</p>
      <div className="panel" style={{ padding: 16 }}>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 0 }}>
          Upload an Excel (.xlsx), CSV or .sql export of failed payments. We read the rows,
          show you what we understood, and only import after you confirm. SQL files are never
          run, and your file is not stored. Payments older than 30 days are analysed but never retried.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <input
            type="file"
            accept=".xlsx,.csv,.sql"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            disabled={busy}
          />
          <button onClick={downloadTemplate} className="btn-secondary" style={{ padding: "4px 10px", fontSize: 12 }}>
            Download template
          </button>
        </div>
        {busy && <p style={{ fontSize: 13 }}>Working…</p>}
        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
        {done && <p style={{ color: "var(--accent)", fontSize: 13 }}>{done}</p>}
        {preview && (
          <div>
            <p style={{ fontSize: 14, marginBottom: 6 }}>
              <b>{preview.valid}</b> of {preview.totalRows} rows look valid
              {preview.skippedCount > 0 && <> · {preview.skippedCount} will be skipped</>}
            </p>
            {preview.warnings.map((w, i) => (
              <p key={i} style={{ color: "var(--warn)", fontSize: 12, margin: "2px 0" }}>{w}</p>
            ))}
            {preview.skipped.length > 0 && (
              <p style={{ color: "var(--text-dim)", fontSize: 12 }}>
                Skipped: {preview.skipped.map((s) => `row ${s.row} (${s.reason})`).join(", ")}
                {preview.skippedCount > preview.skipped.length ? ", …" : ""}
              </p>
            )}
            <table>
              <thead><tr><th>ID</th><th>Amount</th><th>Code</th><th>Reason</th><th>Failed on</th></tr></thead>
              <tbody>
                {preview.sample.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>₹{s.amountRupees.toLocaleString("en-IN")}</td>
                    <td>{s.code}</td>
                    <td>{s.message}</td>
                    <td>{new Date(s.failedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={confirmImport} className="btn-primary" disabled={busy || preview.valid === 0}>
                Import {preview.valid} payment{preview.valid === 1 ? "" : "s"}
              </button>
              <button onClick={() => { setPreview(null); setFile(null); }} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showAuthInfo, setShowAuthInfo] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/metrics");
      if (res.ok) setMetrics(await res.json());
    }
    async function loadKeys() {
      const res = await fetch("/api/keys");
      if (res.ok) setApiKeys((await res.json()).keys);
    }
    load();
    loadKeys();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  // Remember onboarding progress on this device so the landing page can show it.
  useEffect(() => {
    try {
      const done = new Set<number>(JSON.parse(localStorage.getItem("recoverly_steps") || "[]"));
      done.add(1);
      if (apiKeys.length > 0 || newKey) done.add(2);
      if (metrics && metrics.totals.total > 0) done.add(3);
      if (metrics && metrics.totals.recovered > 0) done.add(4);
      localStorage.setItem("recoverly_steps", JSON.stringify(Array.from(done)));
    } catch {}
  }, [apiKeys, newKey, metrics]);

  async function createKey() {
    const res = await fetch("/api/keys", { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      setNewKey(json.apiKey);
      const keysRes = await fetch("/api/keys");
      if (keysRes.ok) setApiKeys((await keysRes.json()).keys);
    }
  }

  function openRevokeModal(key: ApiKey) {
    setRevokeTarget(key);
    setConfirmText("");
  }

  function closeRevokeModal() {
    setRevokeTarget(null);
    setConfirmText("");
  }

  async function confirmRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    const res = await fetch(`/api/keys/${revokeTarget.id}`, { method: "DELETE" });
    setRevoking(false);
    if (res.ok) {
      const keysRes = await fetch("/api/keys");
      if (keysRes.ok) setApiKeys((await keysRes.json()).keys);
      closeRevokeModal();
    }
  }

  // Requires typing the exact key prefix shown in the table, not just
  // clicking a generic "are you sure" - a person has to actually read
  // which key they're about to kill before this button enables.
  const revokeConfirmMatches =
    revokeTarget !== null && confirmText.trim() === revokeTarget.keyPrefix;

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="eyebrow">Recoverly</p>
          <h1>Payment recovery engine</h1>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn-secondary">
          Sign out
        </button>
      </div>
      <p className="subtitle">
        Classifies failed payments, decides the right recovery action, executes it, and logs
        every step. Live view, refreshes every 5s.
      </p>

      <ImportCard />

      <p className="section-title">API keys</p>
      <div className="panel" style={{ padding: 16 }}>
        <button
          onClick={() => setShowAuthInfo((v) => !v)}
          style={{
               display: "block",
               background: "none",
               border: "none",
               color: "var(--accent)",
               fontSize: 13,
               cursor: "pointer",
               padding: 0,
               marginBottom: 14,
                }}
        >
          {showAuthInfo ? "▾" : "▸"} How does authentication work?
        </button>
        {showAuthInfo && (
          <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 0, marginBottom: 12 }}>
            Your backend authenticates to <code>POST /api/ingest</code> with one of these, as{" "}
            <code>Authorization: Bearer &lt;key&gt;</code>. Never share a key or commit it to a repo.
          </p>
        )}

        {newKey && (
          <div
            style={{
              background: "var(--accent-soft)",
              border: "1px solid var(--accent-dim)",
              borderRadius: 8,
              padding: 12,
              marginBottom: 12,
              fontFamily: "var(--mono)",
              fontSize: 13,
              wordBreak: "break-all",
            }}
          >
            {newKey}
            <div style={{ color: "var(--warn)", fontFamily: "inherit", marginTop: 6 }}>
              Save this now — it will not be shown again.
            </div>
          </div>
        )}
        <button onClick={createKey} className="btn-primary" style={{ marginBottom: 12 }}>
          Generate new key
        </button>
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Status</th>
              <th>Created</th>
              <th>Last used</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.length === 0 ? (
              <tr><td colSpan={5} className="empty-state">No keys yet — generate one to start sending data</td></tr>
            ) : (
              apiKeys.map((k) => (
                <tr key={k.id}>
                  <td>{k.keyPrefix}…</td>
                  <td>
                    {k.revokedAt ? (
                      <span className="badge escalated">revoked</span>
                    ) : (
                      <span className="badge classified">active</span>
                    )}
                  </td>
                  <td>{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}</td>
                  <td>
                    {!k.revokedAt && (
                      <button
                        onClick={() => openRevokeModal(k)}
                        className="btn-secondary"
                        style={{ padding: "4px 10px", fontSize: 12, color: "var(--danger)" }}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {revokeTarget && (
        <div
          onClick={closeRevokeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(22, 33, 62, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              borderRadius: 16,
              padding: 28,
              maxWidth: 420,
              width: "90%",
              boxShadow: "0 8px 32px rgba(22,33,62,0.2)",
            }}
          >
            <h1 style={{ fontSize: 18, marginBottom: 8 }}>Revoke this key?</h1>
            <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 0 }}>
              Any backend still using <strong>{revokeTarget.keyPrefix}…</strong> will immediately
              lose access to <code>POST /api/ingest</code>. This can't be undone — you'd need to
              generate a new key.
            </p>
            <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 6 }}>
              Type <strong style={{ color: "var(--text)" }}>{revokeTarget.keyPrefix}</strong> to confirm:
            </p>
            <input
              type="text"
              className="input"
              style={{ width: "100%", marginBottom: 16 }}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={revokeTarget.keyPrefix}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={closeRevokeModal} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={confirmRevoke}
                disabled={!revokeConfirmMatches || revoking}
                style={{
                  background: revokeConfirmMatches ? "var(--danger)" : "var(--border)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: revokeConfirmMatches ? "pointer" : "not-allowed",
                }}
              >
                {revoking ? "Revoking..." : "Revoke key"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!metrics ? (
        <div className="empty-state">Loading metrics — run the seed script and worker to see data here.</div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Amount recovered</div>
              <div className="stat-value accent">{formatRupees(metrics.amountRecoveredPaise)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Recovery rate</div>
              <div className="stat-value">{(metrics.recoveryRate * 100).toFixed(1)}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Retries avoided</div>
              <div className="stat-value warn">{metrics.retriesAvoided}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Escalated</div>
              <div className="stat-value danger">{metrics.totals.escalated}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total processed</div>
              <div className="stat-value">{metrics.totals.total}</div>
            </div>
          </div>

          <p className="section-title">Failures by category</p>
          <div className="panel">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {metrics.byCategory.length === 0 ? (
                  <tr><td colSpan={2} className="empty-state">No classifications yet</td></tr>
                ) : (
                  metrics.byCategory.map((row) => (
                    <tr key={row.category}>
                      <td>{row.category}</td>
                      <td>{row._count.category}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="section-title">Live audit trail (last 25 events)</p>
          <div className="panel">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Transaction</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentAuditEvents.length === 0 ? (
                  <tr><td colSpan={4} className="empty-state">No events yet — ingest a batch to get started</td></tr>
                ) : (
                  metrics.recentAuditEvents.map((event) => (
                    <tr key={event.id}>
                      <td>{new Date(event.createdAt).toLocaleTimeString()}</td>
                      <td><span className={`badge ${event.eventType}`}>{event.eventType}</span></td>
                      <td>{event.transactionId?.slice(0, 10) ?? "—"}</td>
                      <td>{summarize(event.eventType, event.payload)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function summarize(eventType: string, payload: any): string {
  if (!payload) return "";

  if (eventType === "action_executed") {
    const amount = payload.amountRecoveredPaise
      ? `₹${(payload.amountRecoveredPaise / 100).toLocaleString("en-IN")}`
      : null;
    if (payload.success) {
      return `Retry succeeded${amount ? ` — ${amount} recovered` : ""}${
        payload.razorpayOrderId ? ` (order ${payload.razorpayOrderId})` : ""
      }.`;
    }
    return `Retry failed${payload.failureReason ? ` — ${payload.failureReason}` : ""}.`;
  }

  if (payload.reasoning) return payload.reasoning;
  if (payload.reason) return payload.reason;
  if (payload.declineCode) return `Decline code: ${payload.declineCode}`;
  return JSON.stringify(payload).slice(0, 80);
}
