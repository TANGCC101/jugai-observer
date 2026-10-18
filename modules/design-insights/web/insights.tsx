import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { pageMeta } from "@aihot/web/lib/seo";
import { beijingDate, beijingTime } from "@aihot/contracts/time";
import { EMPTY_DATASET, MAX_FILE_BYTES, parseDataset, summarizeNotes } from "../metrics.ts";
import type { Dataset, Note, PriceSignal, Provenance } from "../metrics.ts";

export const handle = { tab: "insights", name: "消费洞察" };
export function meta() { return pageMeta({ title: "小红书装修消费洞察", description: "本地导入授权样本，分开观察装修风格、设计服务价格和内容表现。缺失指标保持未知。", path: "/insights" }); }

const TRAFFIC: Record<Note["traffic"], string> = { organic: "自然流量", paid: "有投流", unknown: "投流未知" };
const SIGNAL: Record<PriceSignal["signal"], string> = { seller_quote: "卖方报价", stated_budget: "预算自述", accepted_quote: "接受报价", rejected_quote: "拒绝报价", paid: "实际支付" };
const UNIT: Record<PriceSignal["unit"], string> = { project: "项目", sqm: "㎡", hour: "小时" };
const METHOD: Record<Provenance["method"], string> = { own_export: "自有后台导出", authorized_export: "获授权导出", manual_public: "公开人工观察" };
const options = (notes: Note[], key: "city" | "account" | "windowHours") => [...new Set(notes.map((n) => String(n[key])))].sort();
const stamp = (value: string) => `${beijingDate(value)} ${beijingTime(value)}`;
function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Insights() {
  const [data, setData] = useState<Dataset>(EMPTY_DATASET);
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("");
  const [account, setAccount] = useState("");
  const [window, setWindow] = useState("");
  const [traffic, setTraffic] = useState<Note["traffic"] | "">("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const importGeneration = useRef(0);
  const resetFilters = () => { setCity(""); setAccount(""); setWindow(""); setTraffic(""); };
  const clear = () => { importGeneration.current += 1; setData(EMPTY_DATASET); resetFilters(); setBusy(false); setMessage("样本已从当前页面清除。"); if (input.current) input.current.value = ""; };
  async function load(file: File | undefined) {
    if (!file) return;
    const generation = ++importGeneration.current;
    setBusy(true); setMessage("");
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error("文件不能超过2MB，请先筛选或拆分样本。");
      const parsed = parseDataset(JSON.parse(await file.text()));
      if (generation !== importGeneration.current) return;
      setData(parsed); resetFilters();
      setMessage(`已读入${parsed.notes.length}篇笔记、${parsed.prices.length}条价格记录。原始凭证仍需你核对。`);
    } catch (error) {
      if (generation === importGeneration.current) setMessage(`导入失败，保留原有样本。${error instanceof SyntaxError ? "文件不是有效JSON。" : error instanceof Error ? error.message : "请核对文件格式。"}`);
    } finally { if (generation === importGeneration.current) setBusy(false); if (input.current) input.current.value = ""; }
  }
  const groups = useMemo(() => summarizeNotes(data.notes, { city: city || undefined, account: account || undefined,
    windowHours: window ? Number(window) : undefined, traffic: traffic || undefined }), [data, city, account, window, traffic]);
  const prices = data.prices.filter((p) => !city || p.city === city);
  const cities = [...new Set([...options(data.notes, "city"), ...data.prices.map((p) => p.city)])].sort();
  return <section className="di di-page">
    <p className="di-eyebrow">私人样本 · 只在当前页面计算</p>
    <h1>客户偏好，先从证据看起。</h1>
    <p className="di-lead">比较装修风格与内容表现，记录设计服务价格。这里没有平台全量数据；导入前不生成市场结论。</p>
    <div className="di-toolbar">
      <label className="di-button">{busy ? "正在读取…" : "导入脱敏样本（JSON）"}<input ref={input} type="file" accept=".json,application/json" disabled={busy} onChange={(e) => { void load(e.target.files?.[0]); }} aria-label="导入脱敏样本（JSON）" /></label>
      <button type="button" className="di-button di-secondary" onClick={() => download("局改观察-空模板.json", EMPTY_DATASET)}>下载空模板</button>
      <button type="button" className="di-button di-secondary" onClick={clear}>清除样本</button>
      <Link to="/sources-guide">来源与口径 →</Link>
    </div>
    <p className="di-small">不上传、不发给模型、不持久保存，刷新或离开后清除。仅导入你有权处理的数据；账号用代号，删除客户身份、私聊、精确地址与令牌。最多各1000条笔记/价格记录、2MB。</p>
    <p role="status" aria-live="polite" className="di-status">{message}</p>

    <div className="di-evidence-grid">
      <div className="di-card"><span className="di-label">01 / 可追溯记录</span><strong>{data.notes.length} 篇笔记 · {data.prices.length} 条价格</strong><p>来源、采样时间与凭证代号由导入者提供，本站未独立核验。</p></div>
      <div className="di-card"><span className="di-label">02 / 可复算统计</span><strong>限定这批样本</strong><p>分开显示风格、形式与窗口。缺失值不补零，统计不代表全站。</p></div>
      <div className="di-card"><span className="di-label">03 / 待验证判断</span><strong>不自动推断市场</strong><p>互动不是停留，报价不是接受度。选样与账号差异仍会影响结果。</p></div>
    </div>

    <section className="di-section"><div className="di-section-heading"><div><p className="di-eyebrow">风格 × 内容形式</p><h2>这批笔记，表现如何</h2></div><span className="di-label">{groups.reduce((sum, row) => sum + row.noteCount, 0)} 篇符合筛选</span></div>
      <div className="di-filters">
        <label>城市<select aria-label="城市" value={city} onChange={(e) => setCity(e.target.value)}><option value="">全部（分组展示）</option>{cities.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label>账号代号<select aria-label="账号代号" value={account} onChange={(e) => setAccount(e.target.value)}><option value="">全部（分组展示）</option>{options(data.notes, "account").map((v) => <option key={v}>{v}</option>)}</select></label>
        <label>观察窗口<select aria-label="观察窗口" value={window} onChange={(e) => setWindow(e.target.value)}><option value="">全部（分组展示）</option>{options(data.notes, "windowHours").map((v) => <option key={v} value={v}>{v}小时</option>)}</select></label>
        <label>投流状态<select aria-label="投流状态" value={traffic} onChange={(e) => setTraffic(e.target.value as Note["traffic"] | "")}><option value="">全部（分组展示）</option>{Object.entries(TRAFFIC).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
      </div>
      {!groups.length ? <div className="di-empty"><strong>{data.notes.length ? "暂无符合筛选的笔记" : "还没有可分析的笔记"}</strong><p>导入自有后台或获授权记录后再观察。公开点赞不能推算停留，未知就保留未知。</p></div> : <div className="di-table-wrap"><table><caption>样本统计；不按高低排名，不作因果或全站偏好结论</caption><thead><tr><th>风格 / 形式</th><th>同组条件</th><th>笔记数</th><th>互动事件 / 阅读</th><th>已报阅读秒数</th></tr></thead><tbody>{groups.map((g, i) => <tr key={i}>
        <td><strong>{g.style}</strong><br />{g.format}</td><td>{g.city} · {g.account}<br />{g.windowHours}小时 · {TRAFFIC[g.traffic]}</td><td>{g.noteCount}</td>
        <td>{g.interactionRate === null ? "未知" : `${(g.interactionRate * 100).toFixed(2)}%`}<small>完整样本 {g.rateSampleCount} 篇 / {g.rateViews} 次阅读</small></td>
        <td>{g.medianReadSeconds === null ? "未知" : `${g.medianReadSeconds.toFixed(1)} 秒`}<small>笔记均值的中位数 · {g.readSampleCount} 篇</small></td>
      </tr>)}</tbody></table></div>}
      <p className="di-small">互动事件/阅读 =（赞＋藏＋评＋分享）/阅读，只使用五项齐全且阅读&gt;0的笔记；它不是独立用户比例，可能超过100%。秒数仅来自明确导出的平均阅读时长，此处取笔记均值的中位数，不代表用户停留分布。不同时间段仍可能不可比；小样本与单一账号不能概括市场。</p>
    </section>

    <section className="di-section"><p className="di-eyebrow">设计服务费 · 逐条保留证据</p><h2>客户说了什么，实际付了什么</h2>
      <p>价格记录只按城市筛选，不受上方笔记账号、窗口或投流筛选影响。不混合城市、币种、单位或服务范围计算“市场可接受价格”。</p>
      {!prices.length ? <div className="di-empty"><strong>暂无价格证据</strong><p>记录服务范围、币种、单位、报价状态与采样时间；施工总价、材料费和设计服务费分别记。</p></div> : <div className="di-table-wrap"><table><caption>价格记录是导入者提供的事实主张，需回到凭证核对</caption><thead><tr><th>证据类型</th><th>金额 / 单位</th><th>城市与服务范围</th><th>出处 / 采样</th></tr></thead><tbody>{prices.map((p) => <tr key={p.id}><td>{SIGNAL[p.signal]}</td><td>{p.amount.toLocaleString("zh-CN")} {p.currency} / {UNIT[p.unit]}</td><td>{p.city}<br />{p.scope}</td><td>{METHOD[p.provenance.method]}<br />{p.provenance.reference}<small>{stamp(p.provenance.capturedAt)}（北京）</small></td></tr>)}</tbody></table></div>}
      <p className="di-small">卖方报价 ≠ 用户预算 ≠ 接受报价 ≠ 实际支付。单笔交易不代表其他客户的接受度；不据此自动建议收费区间。</p>
    </section>

    <details className="di-card di-section"><summary>查看导入的笔记与原始指标（{data.notes.length}篇）</summary><div className="di-records">{data.notes.map((n) => <article key={n.id}><h3><a href={n.url} target="_blank" rel="noopener noreferrer">{n.id} · {n.style} / {n.format} ↗</a></h3><p>{n.city} · {n.account} · {TRAFFIC[n.traffic]} · {n.windowHours}小时</p><p>阅读 {n.views ?? "未知"} / 赞 {n.likes ?? "未知"} / 藏 {n.saves ?? "未知"} / 评 {n.comments ?? "未知"} / 分享 {n.shares ?? "未知"} / 平均阅读 {n.avgReadSeconds === null ? "未知" : `${n.avgReadSeconds}秒`}</p><p className="di-small">发布 {stamp(n.publishedAt)}；采样 {stamp(n.provenance.capturedAt)}（北京）<br />{METHOD[n.provenance.method]} · 凭证 {n.provenance.reference}（待你核对）</p></article>)}</div></details>
    <details className="di-card di-section"><summary>导入文件怎么准备</summary>
      <p>空模板有 notes（笔记）和 prices（设计费）两组，未观察的指标可省略或填 null。不要使用网上估算的停留或缺少单位的报价。由能处理导出的人员按下列字段整理；原始凭证留在你自己的设备上。</p>
      <p><strong>每条笔记：</strong>id（代号）、url（小红书原文，移除所有参数和令牌）、account（账号代号）、city（城市）、style（风格）、format（图文/视频等）、traffic（organic自然 / paid投流 / unknown未知）、windowHours（发布至采样的整小时数，容差1小时）、publishedAt（带时区发布时间）、provenance（见下）。可选指标 views、likes、saves、comments、shares 为非负整数，avgReadSeconds 为后台实际导出的平均阅读秒数。</p>
      <p><strong>每条设计费：</strong>id、city、scope（交付范围与修改次数等）、amount（数值）、currency（如CNY）、unit（project项目 / sqm平方米 / hour小时）、signal（seller_quote卖方报价 / stated_budget预算自述 / accepted_quote接受 / rejected_quote拒绝 / paid实际支付）、provenance。</p>
      <p><strong>每条记录的 provenance：</strong>method（own_export自有后台 / authorized_export获授权导出 / manual_public公开人工观察）、reference（脱敏凭证代号）、capturedAt（如2026-10-18T12:00:00+08:00的带时区采样时间）。公开人工观察不能携带停留秒数。每篇笔记保留一个窗口；其他窗口分别导入，避免重复加权。</p>
    </details>
  </section>;
}
