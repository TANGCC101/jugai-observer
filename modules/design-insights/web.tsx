import { Link, useLocation } from "react-router";
import { defineWebModule } from "@aihot/web/modules";
import { IconGrid, IconList } from "@aihot/web/components/icons";
import "./web/styles.css";

function Introduction() {
  const { pathname } = useLocation();
  if (pathname === "/hot") return <aside className="di di-notice" aria-label="热点口径">本站近48小时独立来源讨论度，非小红书或X全站热度；不能用于判断停留、装修偏好或成交。</aside>;
  if (pathname !== "/") return null;
  return <section className="di di-intro">
    <p className="di-eyebrow">独立设计师的观察台 · 开发预览</p>
    <h1>少猜一点需求，<br /><em>多看一层证据。</em></h1>
    <p>从精装局改的风格、服务费与内容表现，到AI工具的实际变化。把记录、统计和待验证的判断分开。</p>
    <div className="di-lanes">
      <Link to="/insights"><small>01 / 消费洞察</small><strong>小红书装修样本 →</strong><span>导入自有数据，看风格、价格与内容表现</span></Link>
      <Link to="/all?category=ai-models"><small>02 / AI动态</small><strong>X与官方发布 →</strong><span>先看一手资讯；X覆盖取决于授权接入</span></Link>
      <Link to="/all?category=ai-design"><small>03 / 设计工作流</small><strong>国内 AI×室内设计 →</strong><span>区分厂商宣传、独立实测和落地案例</span></Link>
    </div>
    <p className="di-small">候选来源按可追溯性与业务相关性选择，暂无可核验的流量排名。<Link to="/sources-guide">查看来源与接入状态 →</Link></p>
  </section>;
}

export const designInsightsWeb = defineWebModule({
  name: "design-insights",
  sidebar: { section: "设计师工作台", items: [
    { to: "/insights", label: "消费洞察", icon: IconGrid },
    { to: "/sources-guide", label: "来源与口径", icon: IconList },
  ] },
  tabs: [{ key: "insights", to: "/insights", label: "洞察", icon: IconGrid }],
  tools: [{ to: "/insights", label: "消费洞察", icon: <IconGrid size={18} /> }, { to: "/sources-guide", label: "来源与口径", icon: <IconList size={18} /> }],
  root: { Top: Introduction },
  termsLinks: [{ to: "/sources-guide", label: "来源与数据口径" }],
});
