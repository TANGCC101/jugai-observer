import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium, expect, type Browser } from "@playwright/test";
import { fakeApi, startWebServer, visit, type WebServer } from "../../../../apps/web/tests/web-server.ts";

let browser: Browser;
let web: WebServer;
before(async () => { browser = await chromium.launch({ channel: "chromium" }); web = await startWebServer(fakeApi()); });
after(async () => { await browser?.close(); await web?.stop(); });

// All numbers are synthetic test fixtures, never served or seeded as market evidence.
const note = { id: "private-test-marker-01", url: "https://www.xiaohongshu.com/explore/test01", account: "测试账号", city: "测试城市", style: "测试原木", format: "图文",
  traffic: "organic", windowHours: 168, publishedAt: "2026-10-01T00:00:00+08:00",
  provenance: { method: "own_export", reference: "private-test-proof-marker", capturedAt: "2026-10-08T00:00:00+08:00" },
  views: 100, likes: 10, saves: 5, comments: 3, shares: 2, avgReadSeconds: null };
const data = { version: 1, notes: [note, { ...note, id: "private-test-marker-02", url: "https://www.xiaohongshu.com/explore/test02", traffic: "paid" }],
  prices: [{ id: "test-price", city: "测试城市", scope: "测试服务范围，不是实际报价", amount: 1500, currency: "CNY", unit: "project", signal: "seller_quote", provenance: note.provenance }] };
const file = (value: unknown) => ({ name: "synthetic-test.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(value)) });

test("private imports stay on the page, missing readings stay unknown and clear/reload remove the sample", async () => {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  try {
    await visit(page, web.origin + "/insights");
    await expect(page.getByText("还没有可分析的笔记", { exact: true })).toBeVisible();
    const outgoing: string[] = [];
    page.on("request", (r) => outgoing.push(r.url() + (r.postData() ?? "")));
    await page.getByLabel("导入脱敏样本（JSON）").setInputFiles(file(data));
    await expect(page.getByRole("status")).toContainText("已读入2篇笔记、1条价格记录");
    await expect(page.getByRole("cell", { name: /20.00%/ })).toHaveCount(2);
    await expect(page.getByRole("cell", { name: /未知.*笔记均值/ })).toHaveCount(2);
    await expect(page.getByRole("cell", { name: "卖方报价", exact: true })).toBeVisible();
    await page.getByLabel("投流状态", { exact: true }).selectOption("organic");
    await expect(page.getByText("1 篇符合筛选", { exact: true })).toBeVisible();
    assert.equal(outgoing.some((r) => r.includes("private-test-")), false, "sample values must not leave in URLs or request bodies");
    assert.equal(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }).includes("private-test-")), false);
    await page.getByRole("button", { name: "清除样本", exact: true }).click();
    await expect(page.getByText("还没有可分析的笔记", { exact: true })).toBeVisible();
    await page.getByLabel("导入脱敏样本（JSON）").setInputFiles(file(data));
    await expect(page.getByRole("status")).toContainText("已读入2篇笔记");
    await page.reload();
    await expect(page.getByText("还没有可分析的笔记", { exact: true })).toBeVisible();
  } finally { await page.close(); }
});

test("invalid replacement keeps the last good data and public observations cannot import dwell", async () => {
  const page = await browser.newPage();
  try {
    await visit(page, web.origin + "/insights");
    const input = page.getByLabel("导入脱敏样本（JSON）");
    await input.setInputFiles(file(data));
    await expect(page.getByRole("status")).toContainText("已读入2篇笔记");
    await input.setInputFiles(file({ version: 1, notes: [{ ...note, avgReadSeconds: 20, provenance: { ...note.provenance, method: "manual_public" } }], prices: [] }));
    await expect(page.getByRole("status")).toContainText("公开观察不能提供停留时长");
    await expect(page.getByRole("cell", { name: /20.00%/ })).toHaveCount(2);
    await input.setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from("{") });
    await expect(page.getByRole("status")).toContainText("文件不是有效JSON");
  } finally { await page.close(); }
});

test("desktop, phone tabs and the 我的 page expose the new pages without horizontal page overflow", async () => {
  for (const width of [1366, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    try {
      await visit(page, web.origin + "/insights");
      await expect(page.getByRole("link", { name: width === 390 ? "洞察" : "消费洞察", exact: true }).filter({ visible: true })).toBeVisible();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.getByRole("link", { name: "来源与口径 →", exact: true }).click();
      await expect(page.getByRole("heading", { name: "每条消息，从哪里来。" })).toBeVisible();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.goto(web.origin + "/more");
      await expect(page.locator("#main").getByRole("link", { name: "来源与口径", exact: true })).toBeVisible();
    } finally { await page.close(); }
  }
});
