/**
 * File import for failed-payment history. Accepts .xlsx, .csv and .sql.
 *
 * Safety rules:
 *  - .sql files are NEVER executed. We only read the row values out of
 *    INSERT statements as plain text; everything else in the file is ignored.
 *  - Hard limits on size and row count so a huge file can't hurt the server.
 *  - Customer names/emails are not requested. Only an opaque customer id.
 */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_ROWS = 2000;

export type RawRow = Record<string, unknown>;

// ---------- CSV ----------
export function parseCsv(text: string): RawRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const t = text.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (inQuotes) {
      if (ch === '"') {
        if (t[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return tableToObjects(rows);
}

function tableToObjects(table: unknown[][]): RawRow[] {
  if (table.length < 2) return [];
  const headers = table[0].map((h) => String(h ?? "").trim());
  return table.slice(1).map((r) => {
    const o: RawRow = {};
    headers.forEach((h, i) => { if (h) o[h] = r[i] ?? null; });
    return o;
  });
}

// ---------- XLSX ----------
export async function parseXlsx(buffer: Buffer): Promise<RawRow[]> {
  const readXlsxFile = (await import("read-excel-file/node")).default;
  const table = (await readXlsxFile(buffer)) as unknown[][];
  return tableToObjects(table);
}

// ---------- SQL (INSERT statements, read as text, never executed) ----------
export function parseSqlInserts(sql: string): RawRow[] {
  const out: RawRow[] = [];
  const len = sql.length;
  const re = /insert\s+(?:ignore\s+)?into\s+([`"\[\]\w.]+)\s*(?:\(([^)]*)\))?\s*values\s*/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql))) {
    const columns = (m[2] ?? "")
      .split(",")
      .map((c) => c.trim().replace(/^[`"\[]|[`"\]]$/g, ""))
      .filter(Boolean);
    let i = re.lastIndex;
    // read one or more (...) tuples separated by commas until ';'
    for (;;) {
      while (i < len && /\s/.test(sql[i])) i++;
      if (sql[i] !== "(") break;
      i++;
      const values: unknown[] = [];
      let tok = "";
      let quoted = false;
      let q = "";
      let done = false;
      while (i < len && !done) {
        const ch = sql[i];
        if (quoted) {
          if (ch === "\\" && i + 1 < len) { tok += sql[i + 1]; i += 2; continue; }
          if (ch === q) {
            if (sql[i + 1] === q) { tok += q; i += 2; continue; }
            quoted = false; i++; continue;
          }
          tok += ch; i++; continue;
        }
        if (ch === "'" || ch === '"') { quoted = true; q = ch; i++; continue; }
        if (ch === "," || ch === ")") {
          values.push(finishToken(tok));
          tok = "";
          if (ch === ")") done = true;
          i++;
          continue;
        }
        tok += ch; i++;
      }
      const o: RawRow = {};
      values.forEach((v, idx) => { o[columns[idx] ?? `col${idx + 1}`] = v; });
      out.push(o);
      if (out.length > MAX_ROWS + 1) return out;
      while (i < len && /\s/.test(sql[i])) i++;
      if (sql[i] === ",") { i++; continue; }
      break;
    }
    re.lastIndex = i;
  }
  return out;
}

// Unquoted NULL -> null, unquoted number -> number, everything else stays text.
function finishToken(tok: string): unknown {
  const t = tok.trim();
  if (/^null$/i.test(t)) return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

// ---------- Column mapping ----------
const ALIASES: Record<string, string[]> = {
  externalId: ["externalid", "external_id", "transaction_id", "txn_id", "payment_id", "order_id", "id", "reference", "reference_id"],
  customerId: ["customerid", "customer_id", "cust_id", "customer", "user_id", "account_id"],
  subscriptionId: ["subscriptionid", "subscription_id", "sub_id", "plan_id"],
  amountPaise: ["amountpaise", "amount_paise", "paise"],
  amountRupees: ["amount", "amount_inr", "amount_rupees", "value", "total"],
  declineCode: ["declinecode", "decline_code", "error_code", "failure_code", "code", "error_reason", "reason_code", "status_code", "response_code"],
  declineMessage: ["declinemessage", "decline_message", "error_description", "failure_reason", "failure_message", "message", "error_message", "description", "reason"],
  failedAt: ["originalfailedat", "original_failed_at", "failed_at", "created_at", "date", "timestamp", "created", "failure_date", "attempted_at"],
};

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export type MappedTx = {
  externalId: string;
  customerId: string;
  subscriptionId?: string;
  amountPaise: number;
  declineCode: string;
  declineMessage: string;
  originalFailedAt: string;
};

export type MapResult = {
  transactions: MappedTx[];
  skipped: { row: number; reason: string }[];
  mapping: Record<string, string | null>;
  warnings: string[];
};

export function mapRows(rows: RawRow[]): MapResult {
  const warnings: string[] = [];
  const skipped: { row: number; reason: string }[] = [];
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const byNorm = new Map(headers.map((h) => [norm(h), h]));

  const mapping: Record<string, string | null> = {};
  for (const [field, names] of Object.entries(ALIASES)) {
    const hit = names.map((n) => byNorm.get(n)).find(Boolean) ?? null;
    mapping[field] = hit ?? null;
  }

  if (!mapping.declineCode && !mapping.declineMessage) {
    warnings.push("No decline code or failure reason column found. Add a column like decline_code or error_code.");
    return { transactions: [], skipped, mapping, warnings };
  }
  if (!mapping.amountPaise && !mapping.amountRupees) {
    warnings.push("No amount column found. Add a column like amount (in rupees) or amount_paise.");
    return { transactions: [], skipped, mapping, warnings };
  }
  if (!mapping.amountPaise && mapping.amountRupees) {
    warnings.push(`Column "${mapping.amountRupees}" is treated as rupees and converted to paise. Use amount_paise if yours is already in paise.`);
  }
  if (!mapping.externalId) warnings.push("No transaction id column found, so ids were generated from the row number. Re-uploading the same file will create duplicates.");
  if (!mapping.customerId) warnings.push("No customer id column found. That's fine, we don't need names or emails.");

  const seen = new Set<string>();
  const txs: MappedTx[] = [];
  rows.forEach((r, i) => {
    const rowNo = i + 2; // +1 header, +1 human numbering
    const get = (f: string) => (mapping[f] ? r[mapping[f] as string] : undefined);

    let amountPaise: number;
    if (mapping.amountPaise) amountPaise = Math.round(Number(get("amountPaise")));
    else amountPaise = Math.round(Number(String(get("amountRupees") ?? "").replace(/[₹,\s]|inr|rs\.?/gi, "")) * 100);
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) { skipped.push({ row: rowNo, reason: "missing or invalid amount" }); return; }

    const code = String(get("declineCode") ?? "").trim();
    const msg = String(get("declineMessage") ?? "").trim();
    if (!code && !msg) { skipped.push({ row: rowNo, reason: "no decline code or reason" }); return; }

    const externalId = String(get("externalId") ?? "").trim() || `row_${rowNo}`;
    if (seen.has(externalId)) { skipped.push({ row: rowNo, reason: "duplicate transaction id in file" }); return; }
    seen.add(externalId);

    txs.push({
      externalId,
      customerId: String(get("customerId") ?? "").trim() || "unknown",
      subscriptionId: get("subscriptionId") ? String(get("subscriptionId")) : undefined,
      amountPaise,
      declineCode: code || msg.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 60),
      declineMessage: msg || code,
      originalFailedAt: toIso(get("failedAt")),
    });
  });

  return { transactions: txs, skipped, mapping, warnings };
}

function toIso(v: unknown): string {
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString();
  if (typeof v === "number" && v > 20000 && v < 80000) {
    return new Date(Math.round((v - 25569) * 86400 * 1000)).toISOString(); // Excel serial date
  }
  const s = String(v ?? "").trim();
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (dmy) {
    const d = new Date(Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1], +(dmy[4] ?? 0), +(dmy[5] ?? 0)));
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// ---------- entry point ----------
export async function parseUpload(fileName: string, buffer: Buffer): Promise<RawRow[]> {
  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "xlsx") return parseXlsx(buffer);
  if (ext === "csv") return parseCsv(buffer.toString("utf8"));
  if (ext === "sql") return parseSqlInserts(buffer.toString("utf8"));
  throw new Error("Unsupported file type. Upload a .xlsx, .csv or .sql file.");
}
