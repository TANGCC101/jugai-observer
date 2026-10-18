// Private, browser-only inputs. Import provenance is a claim to be checked against the original export,
// not a platform verification. No scraped metric or model estimate is filled in here.
export type Method = "own_export" | "authorized_export" | "manual_public";
export interface Provenance { method: Method; reference: string; capturedAt: string }
export interface Note {
  id: string; url: string; account: string; city: string; style: string; format: string;
  traffic: "organic" | "paid" | "unknown"; windowHours: number; publishedAt: string; provenance: Provenance;
  views: number | null; likes: number | null; saves: number | null; comments: number | null; shares: number | null;
  avgReadSeconds: number | null;
}
export interface PriceSignal {
  id: string; city: string; scope: string; amount: number; currency: string;
  unit: "project" | "sqm" | "hour";
  signal: "seller_quote" | "stated_budget" | "accepted_quote" | "rejected_quote" | "paid";
  provenance: Provenance;
}
export interface Dataset { version: 1; notes: Note[]; prices: PriceSignal[] }
export interface NoteFilter { city?: string; account?: string; windowHours?: number; traffic?: Note["traffic"] }
export interface NoteSummary {
  style: string; format: string; city: string; account: string; windowHours: number; traffic: Note["traffic"];
  noteCount: number; interactionRate: number | null; rateSampleCount: number; rateViews: number;
  medianReadSeconds: number | null; readSampleCount: number;
}

export const EMPTY_DATASET: Dataset = { version: 1, notes: [], prices: [] };
export const MAX_FILE_BYTES = 2 * 1024 * 1024;

function object(value: unknown, keys: string[], at: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${at} 必须是对象`);
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some((key) => !keys.includes(key))) throw new Error(`${at} 含未知字段，请按模板脱敏后导入`);
  return row;
}
function text(value: unknown, at: string): string {
  if (typeof value !== "string" || !value.trim() || value.length > 300) throw new Error(`${at} 必须为 1–300 字符的文字`);
  return value.trim();
}
function choice<T extends string>(value: unknown, values: readonly T[], at: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw new Error(`${at} 须为 ${values.join(" / ")}`);
  return value as T;
}
function number(value: unknown, at: string, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER || (integer && !Number.isSafeInteger(value))) {
    throw new Error(`${at} 必须为非负${integer ? "整数" : "数值"}`);
  }
  return value;
}
function date(value: unknown, at: string): string {
  const raw = text(value, at);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(raw) || !Number.isFinite(Date.parse(raw))) throw new Error(`${at} 须为带时区的 ISO 时间`);
  // Date.parse normalizes impossible dates such as February 30; reject them before accepting a record.
  const [year, month, day] = raw.slice(0, 10).split("-").map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) throw new Error(`${at} 日期不存在`);
  if (Date.parse(raw) > Date.now()) throw new Error(`${at} 不能在未来`);
  return raw;
}
function provenance(value: unknown, at: string): Provenance {
  const row = object(value, ["method", "reference", "capturedAt"], at);
  return {
    method: choice(row.method, ["own_export", "authorized_export", "manual_public"], `${at} 来源方式`),
    reference: text(row.reference, `${at} 凭证引用`), capturedAt: date(row.capturedAt, `${at} 采样时间`),
  };
}
function list(value: unknown, at: string): unknown[] {
  if (!Array.isArray(value) || value.length > 1000) throw new Error(`${at} 必须为数组且不超过 1000 条`);
  return value;
}
function noteUrl(value: unknown): string {
  const raw = text(value, "笔记 URL");
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash ||
      !["www.xiaohongshu.com", "xiaohongshu.com"].includes(url.hostname) || !/^\/(?:explore|discovery\/item)\/[a-zA-Z0-9]+\/?$/.test(url.pathname)) {
    throw new Error("笔记 URL 须为小红书 HTTPS 原文链接，移除登录/分享令牌、参数与片段");
  }
  return `https://www.xiaohongshu.com/explore/${url.pathname.split("/").filter(Boolean).at(-1)}`;
}
function unique(rows: { id: string }[], at: string) {
  if (new Set(rows.map((r) => r.id)).size !== rows.length) throw new Error(`${at} ID 重复`);
}

export function parseDataset(input: unknown): Dataset {
  const data = object(input, ["version", "notes", "prices"], "文件");
  if (data.version !== 1) throw new Error("文件 version 须为 1");
  const notes: Note[] = list(data.notes, "notes").map((input, index) => {
    const at = `笔记 ${index + 1}`;
    const row = object(input, ["id", "url", "account", "city", "style", "format", "traffic", "windowHours", "publishedAt", "provenance", "views", "likes", "saves", "comments", "shares", "avgReadSeconds"], at);
    const proof = provenance(row.provenance, at);
    const publishedAt = date(row.publishedAt, `${at} 发布时间`);
    const windowHours = number(row.windowHours, `${at} 观察小时数`, true);
    if (windowHours < 1) throw new Error(`${at} 观察小时数须大于零`);
    const elapsed = (Date.parse(proof.capturedAt) - Date.parse(publishedAt)) / 3_600_000;
    if (Math.abs(elapsed - windowHours) > 1 || elapsed < 0) throw new Error(`${at} 采样时间与观察窗口不符（容差 1 小时）`);
    const metric = (key: string) => row[key] == null ? null : number(row[key], `${at} ${key}`, key !== "avgReadSeconds");
    const avgReadSeconds = metric("avgReadSeconds");
    if (avgReadSeconds !== null && proof.method === "manual_public") throw new Error(`${at} 公开观察不能提供停留时长，须有自有或授权后台导出`);
    if (avgReadSeconds !== null && avgReadSeconds > elapsed * 3600) throw new Error(`${at} 平均阅读秒数超过发布至采样时长，请核对是否误填毫秒或其他指标`);
    return { id: text(row.id, `${at} ID`), url: noteUrl(row.url), account: text(row.account, `${at} 账号代号`),
      city: text(row.city, `${at} 城市`), style: text(row.style, `${at} 风格`), format: text(row.format, `${at} 形式`),
      traffic: choice(row.traffic, ["organic", "paid", "unknown"], `${at} 投流状态`), windowHours, publishedAt, provenance: proof,
      views: metric("views"), likes: metric("likes"), saves: metric("saves"), comments: metric("comments"), shares: metric("shares"), avgReadSeconds };
  });
  unique(notes, "笔记");
  if (new Set(notes.map((n) => n.url)).size !== notes.length) throw new Error("笔记 URL 重复，请每篇保留一个观察窗口，分别导入其他窗口");
  const prices: PriceSignal[] = list(data.prices, "prices").map((input, index) => {
    const at = `价格 ${index + 1}`;
    const row = object(input, ["id", "city", "scope", "amount", "currency", "unit", "signal", "provenance"], at);
    const currency = text(row.currency, `${at} 币种`);
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error(`${at} 币种须为三位大写代码，如 CNY`);
    return { id: text(row.id, `${at} ID`), city: text(row.city, `${at} 城市`), scope: text(row.scope, `${at} 服务范围`),
      amount: number(row.amount, `${at} 金额`), currency, unit: choice(row.unit, ["project", "sqm", "hour"], `${at} 单位`),
      signal: choice(row.signal, ["seller_quote", "stated_budget", "accepted_quote", "rejected_quote", "paid"], `${at} 证据类型`),
      provenance: provenance(row.provenance, at) };
  });
  unique(prices, "价格");
  return { version: 1, notes, prices };
}

export function summarizeNotes(notes: Note[], filter: NoteFilter): NoteSummary[] {
  const groups = new Map<string, Note[]>();
  for (const note of notes) {
    if ((filter.city && note.city !== filter.city) || (filter.account && note.account !== filter.account) ||
        (filter.windowHours !== undefined && note.windowHours !== filter.windowHours) || (filter.traffic && note.traffic !== filter.traffic)) continue;
    const key = JSON.stringify([note.style, note.format, note.city, note.account, note.windowHours, note.traffic]);
    const group = groups.get(key) ?? [];
    group.push(note);
    groups.set(key, group);
  }
  return [...groups.values()].map((rows) => {
    const n = rows[0];
    const complete = rows.filter((r) => r.views !== null && r.views > 0 && [r.likes, r.saves, r.comments, r.shares].every((v) => v !== null));
    const views = complete.reduce((sum, r) => sum + r.views!, 0);
    const events = complete.reduce((sum, r) => sum + r.likes! + r.saves! + r.comments! + r.shares!, 0);
    const read = rows.flatMap((r) => r.avgReadSeconds === null ? [] : [r.avgReadSeconds]).sort((a, b) => a - b);
    const mid = Math.floor(read.length / 2);
    return { style: n.style, format: n.format, city: n.city, account: n.account, windowHours: n.windowHours, traffic: n.traffic,
      noteCount: rows.length, interactionRate: views > 0 ? events / views : null, rateSampleCount: complete.length, rateViews: views,
      medianReadSeconds: read.length ? (read.length % 2 ? read[mid] : (read[mid - 1] + read[mid]) / 2) : null, readSampleCount: read.length };
  });
}
