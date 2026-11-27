import { parseCsv, parseSqlInserts, mapRows, parseXlsx } from "../src/lib/import/parse";
import { readFileSync } from "fs";
import assert from "assert";

const csv = `transaction_id,customer_id,amount,error_code,error_description,failed_at
t1,c1,"1,299",insufficient_funds,"Not enough balance, sorry",2026-11-01T10:00:00Z
t2,c2,499,EXPIRED_CARD,Card expired,03/11/2026
t2,c3,499,EXPIRED_CARD,Card expired,03/11/2026
t4,c4,-5,x,y,
t5,c5,799,,,
`;
const c = mapRows(parseCsv(csv));
assert.equal(c.transactions.length, 2);
assert.equal(c.transactions[0].amountPaise, 129900);
assert.equal(c.transactions[0].declineMessage, "Not enough balance, sorry");
assert.equal(c.transactions[1].originalFailedAt.slice(0, 10), "2026-11-03");
assert.equal(c.skipped.length, 3);
console.log("csv ok", c.skipped.map((s) => s.reason));

const sql = `-- dump
CREATE TABLE failed_payments (id int);
INSERT INTO \`failed_payments\` (\`payment_id\`, \`customer_id\`, \`amount_paise\`, \`decline_code\`, \`decline_message\`, \`failed_at\`) VALUES
 ('p1','c1',49900,'insufficient_funds','Customer''s balance is low','2026-11-02 09:30:00'),
 ('p2','c2',99900,'card_expired','Card \\'expired\\'; do not retry',NULL),
 ('p3','c3',19900,'do_not_honor','Declined (bank); try later','2026-11-03');
DROP TABLE users; INSERT INTO other (a) VALUES (1);`;
const s = mapRows(parseSqlInserts(sql));
console.log(s.transactions.map((t) => [t.externalId, t.amountPaise, t.declineMessage]));
assert.equal(s.transactions.length, 3);
assert.equal(s.transactions[0].declineMessage, "Customer's balance is low");
assert.equal(s.transactions[1].declineMessage, "Card 'expired'; do not retry");
assert.equal(s.transactions[2].declineMessage, "Declined (bank); try later");
console.log("sql ok");

(async () => {
  const x = mapRows(await parseXlsx(readFileSync("ml/data/sample.xlsx")));
  assert.equal(x.transactions.length, 2);
  assert.equal(x.transactions[0].amountPaise, 59900);
  console.log("xlsx ok", x.transactions[0]);
})();
