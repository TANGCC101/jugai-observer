import { Link } from "react-router";
import { SOURCE_CATALOG } from "../catalog.ts";
import { pageMeta } from "@aihot/web/lib/seo";

export const handle = { tab: "insights", name: "来源与口径" };
export function meta() { return pageMeta({ title: "来源与数据口径", description: "X、公众号、设计论坛与官方RSS的接入条件、覆盖限制和降级方式。", path: "/sources-guide" }); }

export default function Sources() {
  return <section className="di di-page">
    <p className="di-eyebrow">来源公开 · 覆盖有边界</p>
    <h1>每条消息，从哪里来。</h1>
    <p className="di-lead">这里是接入方案与一次核对记录，<strong>不是实时健康状态或平台流量排名</strong>。自动采集默认关闭，实际运行状态由运营者在后台核对。</p>
    <div className="di-notice"><strong>三条底线</strong><p>缺失不填零；互动不换算停留；卖方报价不当作用户接受价格。公开资讯只显示必要摘要和原文链接，全文默认关闭。</p></div>
    <div className="di-source-grid">{SOURCE_CATALOG.map((s) => <article className="di-card" key={s.sourceId}>
      <p className="di-eyebrow">{s.lane}</p><h2><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name} ↗</a></h2>
      <dl><dt>接入</dt><dd>{s.access}</dd><dt>边界</dt><dd>{s.limit}</dd><dt>不可用时</dt><dd>{s.fallback}</dd></dl>
    </article>)}</div>
    <section className="di-card"><h2>消费洞察里的“证据”是什么</h2>
      <p>导入记录保留采样时间、原文链接与脱敏凭证代号；系统只校验格式，无法替你核验原始凭证。统计可以复算，结果只描述这批样本。</p>
      <p>停留仅接受自有或授权后台实际导出的阅读秒数。没有时显示“未知”，不从点赞、收藏、评论、视频完播或第三方估算倒推。</p>
      <p>风格比较须控制账号、城市、内容形式、投流与观察窗口；样本仍可能有选样偏差。设计费按报价、预算自述、接受/拒绝报价与实际支付分别记录，币种、单位与交付内容逐条保留。</p>
      <Link to="/insights" className="di-button">打开消费洞察 →</Link>
    </section>
    <p className="di-small">接口规则参考：<a href="https://docs.x.com/x-api/posts/search/introduction" target="_blank" rel="noopener noreferrer">X官方搜索文档</a> · <a href="https://openaccount.xiaohongshu.com/docs/api-reference" target="_blank" rel="noopener noreferrer">小红书开放平台文档</a>。访问能力与使用授权须分别核对，开放平台文档不证明可获取全站笔记停留。</p>
  </section>;
}
