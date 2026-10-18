# 局改观察：使用与运营

## 站点范围

暂名「局改观察」，为通过小红书获客、以设计服务费为收入的独立精装局改设计师服务。首页分消费样本、AI动态、国内AI×设计三线；资讯仍由原有 publication 层统一供网页、RSS、API、Agent Markdown 和 MCP 读取。新增私人样本不进入这些公开出口。

用户暂未指定城市、价位、账号，要求先选流量高的几个。当前没有可比、可核验的跨平台流量榜，因此名单按业务相关性、可追溯性与接入可行性选择，**不声称流量最高**。站名、分类和名单均可在合并前审阅调整。

## 消费洞察 /insights

只导入你有权处理的脱敏 JSON。数据只在当前页面内存中，不上传、不交给模型、不存浏览器持久存储；离开页面、刷新或清除后需重新导入。下载空模板可得到：

```json
{"version":1,"notes":[],"prices":[]}
```

单文件上限2MiB；笔记和价格各最多1000条。原始导出、授权与凭证留在用户自己的设备，reference 只填写脱敏代号。系统只能检查字段与口径，不能证明授权或凭证真实。

### 笔记字段

| 字段 | 口径 |
|---|---|
| id / account | 笔记代号 / 账号代号，不含真实用户身份 |
| url | 小红书 HTTPS 原文链接，移除所有查询参数、片段、分享令牌；同篇笔记去重 |
| city / style / format | 城市、风格、图文/视频等内容形式；原始标签由导入者整理 |
| traffic | organic自然、paid投流、unknown未知，不把未知当自然 |
| windowHours | 发布到采样的整小时数，正整数，与时间戳容差1小时 |
| publishedAt | 带时区的 ISO 发布时间 |
| views / likes / saves / comments / shares | 阅读、赞、藏、评、分享；非负整数，缺失省略或null；不要把曝光当阅读 |
| avgReadSeconds | 后台实际导出的平均阅读秒数，非负数；无字段或无权限填null，不能填互动推算值 |
| provenance | method、reference、capturedAt，见下 |

同一文件每篇笔记仅保留一个观察窗口，其余窗口分文件导入，避免重复加权。系统分开账号、城市、风格、内容形式、窗口与投流状态，不自动做偏好排名。互动事件/阅读只统计上述五项全部存在且阅读>0的记录，显示有效篇数和阅读分母；可能超过100%，不是独立用户比例。停留只显示导入的后台平均阅读秒数的**笔记间中位数**和有效篇数，不代表用户停留分布。即使同组仍可能受发布时间、选样偏差等影响，无统计显著性承诺。

### 设计服务价格字段

id、city、scope（具体交付/面积/修改次数/含税等边界）、amount、currency（三位大写，如CNY）、unit（project / sqm / hour）、signal、provenance。

signal 必须区分 seller_quote（卖方报价）、stated_budget（用户预算自述）、accepted_quote（接受报价）、rejected_quote（拒绝报价）、paid（实际支付）。接受或支付都须有对应原始凭证。价格逐条展示，不混合单位、城市、币种或服务范围计算一个“可接受价格区间”。施工、材料、软装采购预算不填成设计服务费。城市筛选作用于价格记录，账号/窗口/投流筛选只作用于笔记。

### 每条记录的凭证来源

```json
{"method":"own_export","reference":"本地导出行号或授权记录代号","capturedAt":"2026-10-18T12:00:00+08:00"}
```

method：own_export（自有后台）、authorized_export（获授权导出）、manual_public（公开人工观察）。公开观察不能携带停留值。日期必须存在、带时区且不在未来。请勿放入客户姓名、手机、微信号、精确住址、私聊、截图、Cookie或任何访问令牌。界面文本经过React转义；笔记链接限制为小红书原文域名与路径。

## 信源接入与降级 /sources-guide

`industry/sources.json` 是启动种子，不是线上健康状态。2026-10-18实际读取并解析四个订阅：OpenAI News（1299条）、DeepMind（100条）、Hugging Face（880条）、量子位（10条），均HTTP200且为有效RSS。条数只证明此次响应可解析，不代表流量、全文许可、持续可用性或新鲜度保证。常见机器之心 `/rss` 当时跳转数据服务页，未配置为RSS。

| 渠道 | 已交付 | 启用条件 | 失败时 |
|---|---|---|---|
| 官方AI与国内媒体RSS | 4个种子，全文和再分发全文关闭 | 核对许可、预算后启用全局采集与模型开关 | 按既有源健康记录重试；暂停故障源，不刷新旧文日期 |
| X AI | external-x-ai隔离入口；候选OpenAI、AnthropicAI、GoogleDeepMind | 人工审核原帖，或有权限的外部官方API任务推送；此版本没有官方API采集器 | 暂停X覆盖，以官方RSS替代，注明无法反映X讨论 |
| 国内AI×设计 | external-cn-ai-design隔离入口；候选酷家乐官方产品动态、三维家 | 作者授权摘要或明确允许的官方接口；页面规则需另行验证 | 人工原文索引，缺可信发布时间不公开 |
| 微信公众号 | external-wechat-design隔离入口；候选量子位、机器之心、设计本、室内设计联盟，须核对主体 | 作者/运营者授权供稿或平台允许接口；不能仅凭名称编造ghid | 原文索引或授权短摘要；无许可则不采集 |
| 设计社区 | external-design-community隔离入口；设计本、站酷、室内设计联盟为候选 | 允许的RSS/API或授权人工记录；未验证选择器不自动跑 | 结构变化/访问限制时暂停，人工链接索引 |

现有 `x_search` 使用SocialData，`mp_account` 使用极致了；均非平台官方授权证明。本版种子不启用这些付费采集器。运营者选择时须分别核对访问权限、内容使用许可、费用和平台条款。绝不因服务商售卖接口就宣称合法授权；不绕过登录、验证码、付费墙，不用Cookie抓取。

来源边界参考：[X官方搜索文档](https://docs.x.com/x-api/posts/search/introduction)、[小红书开放平台接口参考](https://openaccount.xiaohongshu.com/docs/api-reference)、[微信公众号开发文档](https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Access_Overview.html)。开放平台有接口不意味着具有全站装修笔记、停留或成交数据权限。当前接入方案优先授权和人工可追溯资料，不保证任何平台永久稳定。

### 跑通一个隔离推送

设置后端 `INGEST_TOKEN`（至少16位，不能是占位值），重启API；安全阀保持关闭时可检查推送写入，**worker不启动**，避免队列触发外部处理。从合法来源人工整理payload，路径用你自己的文件名，不把令牌写入文件或Git：

```json
{
  "sourceId": "external-x-ai",
  "items": [{
    "title": "原帖真实标题或忠实短标题",
    "url": "https://x.com/真实账号/status/真实帖子ID",
    "publishedAt": "原帖真实发布时间，带时区",
    "raw": {"rightsReference":"脱敏授权代号", "editorReviewed":true}
  }]
}
```

以上是结构说明，含占位值，**不能当运营数据发送**。每批最多50条；用已经核对的真实资料替换后：

```bash
curl --fail-with-body "$SITE_URL/api/ingest/items" \
  -H "Authorization: Bearer $INGEST_TOKEN" \
  -H 'Content-Type: application/json' --data-binary @approved-items.json
```

新入口默认isolated，不进入公开页面。先在后台核对来源归属、时间、授权、摘要与事实，再决定是否切换editorial；一个渠道有多个独立出版者时，应按出版者另建external sourceId，填owner_entity_id，而非全部混进一个来源。分发帖子可用hot_signal参与讨论证据，但不能变成全网热度。raw中的授权代号只是记录，不是自动合规认证；不得放任何私聊或客户资料。推送通常只提供索引，后续正文处理由框架完成，受访问和版权限制；不是免费付费接口替身。

## 上线前仍需决定

1. 最终站名、域名、运营者、联系邮箱、条款生效日、使用范围和日志保存期限。
2. 重点城市、面积、交付服务包、价格观察单位与内容账号；当前没有默认价格带。
3. 首批X账号、公众号真实主体/ghid、论坛与授权证明；允许的正文与展示范围。
4. 是否购买平台API或第三方服务、费用上限、抓取频率与降级时接受的覆盖缺口。
5. 提供100–200条人工标注的行业样本校准精选；现有门槛原样保留T1=60、T1_5=65、T2=76，未声称适合装修行业。

正式部署按 [deploy.md](deploy.md) 与本次更新说明。不要将本站专用定制提作上游通用功能；在自己的Fork/分支保留修改。本模块未改变公开字段含义，仍为4.0.0接口；新部署使用jugai工具前缀，既有MCP客户端需要更新工具名。
