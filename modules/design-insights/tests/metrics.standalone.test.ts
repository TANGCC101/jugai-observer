import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDataset, summarizeNotes } from "../metrics.ts";

// Synthetic records exercise arithmetic and validation; they are never seeded into the site.
function note(extra: Record<string, unknown> = {}) {
  return {
    id: "n1", url: "https://www.xiaohongshu.com/explore/abc", account: "account-a", city: "杭州",
    style: "原木", format: "图文", traffic: "organic", windowHours: 168,
    publishedAt: "2026-10-01T00:00:00+08:00",
    provenance: { method: "own_export", reference: "export-row-1", capturedAt: "2026-10-08T00:00:00+08:00" },
    views: 100, likes: 10, saves: 5, comments: 3, shares: 2, avgReadSeconds: null, ...extra,
  };
}
const dataset = (notes: unknown[] = [], prices: unknown[] = []) => ({ version: 1, notes, prices });

test("empty data remains empty and missing counts never become zero", () => {
  assert.deepEqual(summarizeNotes(parseDataset(dataset()).notes, {}), []);
  const parsed = parseDataset(dataset([note({ views: null, likes: null })]));
  const [row] = summarizeNotes(parsed.notes, {});
  assert.equal(row.interactionRate, null);
  assert.equal(row.rateSampleCount, 0);
  assert.equal(row.medianReadSeconds, null);
});

test("interaction rate uses only complete records and reports its denominator", () => {
  const input = [note(), note({ id: "n2", url: "https://www.xiaohongshu.com/explore/def", views: 300, likes: 30, saves: 10, comments: 0, shares: 0 }),
    note({ id: "n3", url: "https://www.xiaohongshu.com/explore/ghi", views: 1000, shares: null }),
    note({ id: "n4", url: "https://www.xiaohongshu.com/explore/jkl", views: 0 })];
  const [row] = summarizeNotes(parseDataset(dataset(input)).notes, {});
  assert.equal(row.noteCount, 4);
  assert.equal(row.interactionRate, 0.15); // (20+40)/(100+300)
  assert.equal(row.rateSampleCount, 2);
  assert.equal(row.rateViews, 400);
});

test("window, traffic, city and account filters separate incomparable samples", () => {
  const input = [note(), note({ id: "n2", url: "https://www.xiaohongshu.com/explore/def", traffic: "paid" }),
    note({ id: "n3", url: "https://www.xiaohongshu.com/explore/ghi", windowHours: 24, provenance: { method: "own_export", reference: "day-1", capturedAt: "2026-10-02T00:00:00+08:00" } }),
    note({ id: "n4", url: "https://www.xiaohongshu.com/explore/jkl", account: "account-b", city: "上海" })];
  const rows = summarizeNotes(parseDataset(dataset(input)).notes, { windowHours: 168, traffic: "organic", city: "杭州", account: "account-a" });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].noteCount, 1);
});

test("without filters distinct windows, accounts and traffic never pool into one ranking", () => {
  const input = [note(), note({ id: "n2", url: "https://www.xiaohongshu.com/explore/def", traffic: "paid" })];
  assert.equal(summarizeNotes(parseDataset(dataset(input)).notes, {}).length, 2);
});

test("only actual authorized readings contribute to the median of note averages", () => {
  const input = [note({ avgReadSeconds: 12 }), note({ id: "n2", url: "https://www.xiaohongshu.com/explore/def", avgReadSeconds: 20 }),
    note({ id: "n3", url: "https://www.xiaohongshu.com/explore/ghi", avgReadSeconds: null })];
  const [row] = summarizeNotes(parseDataset(dataset(input)).notes, {});
  assert.equal(row.medianReadSeconds, 16);
  assert.equal(row.readSampleCount, 2);
  assert.throws(() => parseDataset(dataset([note({ avgReadSeconds: 604801 })])), /秒数/,
    "a reported per-view duration cannot exceed the publication-to-capture interval; catch milliseconds mistaken for seconds");
  assert.throws(() => parseDataset(dataset([note({ avgReadSeconds: 12, provenance: { method: "manual_public", reference: "public-note", capturedAt: "2026-10-08T00:00:00+08:00" } })])), /停留/);
});

test("invalid counts, dates, URLs, credentials, duplicates and unknown fields are rejected", () => {
  for (const extra of [{ views: -1 }, { likes: 1.2 }, { shares: "12" }, { avgReadSeconds: Infinity }, { windowHours: 0 },
    { publishedAt: "2026-02-30T00:00:00Z" }, { publishedAt: "2026-10-01" },
    { publishedAt: "2026-10-09T00:00:00Z" }, { url: "javascript:alert(1)" }, { url: "https://user:password@www.xiaohongshu.com/explore/a" },
    { url: "https://www.xiaohongshu.com/explore/a?xsec_token=secret" }, { url: "https://evil.example/note" },
    { price: 888 }, { provenance: { method: "guessed", reference: "x", capturedAt: "2026-10-08T00:00:00Z" } }]) {
    assert.throws(() => parseDataset(dataset([note(extra)])), `accepted ${JSON.stringify(extra)}`);
  }
  assert.throws(() => parseDataset(dataset([note(), note({ id: "n2" })])), /重复/);
  assert.throws(() => parseDataset(dataset([note(), note({ url: "https://www.xiaohongshu.com/explore/def" })])), /重复/);
  assert.throws(() => parseDataset(dataset([note(), note({ id: "n2", url: "https://xiaohongshu.com/explore/abc/" })])), /重复/);
  assert.throws(() => parseDataset(dataset([note({ provenance: { method: "own_export", reference: "", capturedAt: "2026-10-08T00:00:00Z" } })])), /凭证/);
  assert.throws(() => parseDataset({ version: 1, notes: [], prices: [], cookie: "secret" }));
  assert.throws(() => parseDataset(dataset(Array.from({ length: 1001 }, () => note()))), /1000/);
});

test("design prices retain evidence type, currency, service scope and unit without claiming a market price", () => {
  const price = { id: "p1", city: "杭州", scope: "客厅软装方案，2轮修改，不含施工", amount: 1500, currency: "CNY", unit: "project",
    signal: "seller_quote", provenance: { method: "authorized_export", reference: "quote-row-1", capturedAt: "2026-10-08T00:00:00Z" } };
  const parsed = parseDataset(dataset([], [price]));
  assert.equal(parsed.prices[0].signal, "seller_quote");
  assert.equal(parsed.prices[0].amount, 1500);
  assert.equal(parsed.prices[0].unit, "project");
  for (const extra of [{ amount: -1 }, { unit: "unknown" }, { signal: "market_accepted" }, { scope: "" }]) {
    assert.throws(() => parseDataset(dataset([], [{ ...price, ...extra }])));
  }
});
