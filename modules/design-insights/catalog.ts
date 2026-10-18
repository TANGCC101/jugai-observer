// A deployment plan, deliberately separate from runtime source health and from platform traffic ranks.
export const SOURCE_CATALOG = [
  { name: "OpenAI News", url: "https://openai.com/news/", sourceId: "rss-openai-news", lane: "X AI 的官方替代来源",
    access: "官方 RSS；2026-10-18 响应核对有效，自动采集待运营者启用。", limit: "仅反映官网发布，不覆盖 X 讨论或全站热度。", fallback: "RSS 故障时暂停该源，保留原文索引与已收录时间，不把旧文刷新为新消息。" },
  { name: "Google DeepMind", url: "https://deepmind.google/blog/", sourceId: "rss-google-deepmind", lane: "X AI 的官方替代来源",
    access: "官方 RSS；2026-10-18 响应核对有效，自动采集待启用。", limit: "厂商声明与独立评测分开；官网不替代 X 社区讨论。", fallback: "暂用其他一手报道交叉核对，不能把缺席解释为没有进展。" },
  { name: "Hugging Face Blog", url: "https://huggingface.co/blog", sourceId: "rss-hugging-face", lane: "AI 工具与实践",
    access: "官方 RSS；2026-10-18 响应核对有效。", limit: "平台博客中的作者观点、项目自述不等于平台背书。", fallback: "记录失败，等待恢复或人工提交原项目链接；不自动转全文镜像。" },
  { name: "量子位", url: "https://www.qbitai.com/", sourceId: "rss-qbitai", lane: "国内 AI 资讯",
    access: "官网 RSS；2026-10-18 响应核对有效。", limit: "媒体为二手来源；优先追到原始发布。不推定拥有全文许可。", fallback: "RSS 不可用时只保留已收录摘要和原文链接，或授权人工补录。" },
  { name: "X：OpenAI / AnthropicAI / GoogleDeepMind", url: "https://docs.x.com/x-api/posts/search/introduction", sourceId: "external-x-ai", lane: "X AI 动态（候选）",
    access: "已建立隔离推送入口。可先人工审核原帖；官方 API 需运营者取得访问权限与预算，由外部任务调用后推送。本项目未实现官方 API 采集器。", limit: "这些账号是官方发布候选，未经跨平台流量排名。SocialData 并非 X 官方 API，现成适配器默认不启用。", fallback: "无权限、限流或预算耗尽时暂停；降级到官方博客 RSS，明确缺少 X 讨论覆盖，不伪造帖子热度。" },
  { name: "酷家乐官方产品动态 / 三维家", url: "https://b.kujiale.com/news", sourceId: "external-cn-ai-design", lane: "国内 AI×设计（候选）",
    access: "官网产品文档与作者授权摘要，走隔离推送审核；未启用未经核验的页面选择器。", limit: "候选已按业务相关性选取，不声称流量最高。营销提效、商用授权、效果图可落地性需分别核对。", fallback: "列表或页面变动时改为人工索引；没有可信发布日期不进入公开时间线。" },
  { name: "公众号：量子位、机器之心、设计本、室内设计联盟", url: "https://mp.weixin.qq.com/", sourceId: "external-wechat-design", lane: "微信公众号（候选，需核对主体）",
    access: "作者/运营者授权供稿或平台明确允许的接口；已建立隔离推送入口。公众号名称仅供候选确认，不编造 ghid 或 RSS 地址。", limit: "现有极致了适配器并非微信官方授权证明。没有许可不启用，不采集读者身份或私域聊天。", fallback: "保留人工原文索引或作者允许的短摘要；不转用 Cookie、登录绕过或全文镜像。" },
  { name: "设计本 / 站酷 / 室内设计联盟", url: "https://www.shejiben.com/", sourceId: "external-design-community", lane: "设计社区（候选）",
    access: "管理员或作者许可的 RSS/接口优先；无已验证订阅时采用人工链接与授权短摘要，推送后仍隔离审核。", limit: "作品热度不代表业主支付意愿；浏览数、收藏、发布时间按原始页面口径记录。候选不是流量榜。", fallback: "访问限制或结构变动时暂停自动化，转人工索引，不绕过验证码或复制会员内容。" },
] as const;
