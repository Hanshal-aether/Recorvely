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

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [apiKeys, setApiKeys] = useState<{ id: string; keyPrefix: string; createdAt: string; lastUsedAt: string | null }[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);

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

  async function createKey() {
    const res = await fetch("/api/keys", { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      setNewKey(json.apiKey);
      const keysRes = await fetch("/api/keys");
      if (keysRes.ok) setApiKeys((await keysRes.json()).keys);
    }
  }

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="eyebrow">Recoverly</p>
          <h1>Payment recovery engine</h1>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-dim)",
            borderRadius: "8px",
            padding: "8px 14px",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </div>
      <p className="subtitle">
        Classifies failed payments, decides the right recovery action, executes it, and logs
        every step. Live view, refreshes every 5s.
      </p>

      <p className="section-title">API keys</p>
      <div className="panel" style={{ padding: 16 }}>
        <p style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 0 }}>
          Your backend authenticates to <code>POST /api/ingest</code> with one of these, as{" "}
          <code>Authorization: Bearer &lt;key&gt;</code>. Never share a key or commit it to a repo.
        </p>
        {newKey && (
          <div
            style={{
              background: "var(--surface-2)",
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
        <button
          onClick={createKey}
          style={{
            background: "var(--accent)",
            color: "#0E1512",
            border: "none",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          Generate new key
        </button>
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Created</th>
              <th>Last used</th>
            </tr>
          </thead>
          <tbody>
            {apiKeys.length === 0 ? (
              <tr><td colSpan={3} className="empty-state">No keys yet — generate one to start sending data</td></tr>
            ) : (
              apiKeys.map((k) => (
                <tr key={k.id}>
                  <td>{k.keyPrefix}…</td>
                  <td>{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


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
                      <td>{summarize(event.payload)}</td>
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

function summarize(payload: any): string {
  if (!payload) return "";
  if (payload.reasoning) return payload.reasoning;
  if (payload.reason) return payload.reason;
  if (payload.declineCode) return payload.declineCode;
  return JSON.stringify(payload).slice(0, 80);
}
