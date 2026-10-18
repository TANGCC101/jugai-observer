# 局改观察实施计划

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task in the current session.

**Goal:** 交付可核验、可导入自有数据的局改设计资讯站。

**Architecture:** 保留引擎，定制 site/industry。独立浏览器模块处理私人样本，不新建公开数据出口或付费调用。

**Tech Stack:** Node 24 / TypeScript / React Router / PostgreSQL 17。

**Spec:** docs/superpowers/specs/2026-10-18-design-insights.md

## Global Constraints

- 独立分支 codex/interior-design-insights，主分支不动。
- 采集、模型、推送、IndexNow 开关关闭；不提交密钥、真实私人样本。
- 不改历史迁移、引擎接口或选择门槛；只新增内部模块工作区，不升级第三方依赖。
- 缺失不是零；报价不是支付；互动不是停留；候选信源不是流量排名。

## Review Focus

- 重复笔记和恶意链接不能污染样本。
- 公开记录不能伪装后台停留数据。
- 缺失指标和零分母不能产生有效互动率。
- 不同观察窗口和投流记录必须可分开分析。
- 价格币种、单位、范围和证据状态逐条保留。

### Task 1: 可复算的私人消费洞察

**Files:** modules/design-insights/{metrics.ts,tests/metrics.standalone.test.ts}

**Interfaces:** parseDataset(input: unknown): Dataset；summarizeNotes(notes: Note[], filter: NoteFilter): NoteSummary[]。

- [x] 先写失败测试：空值、重复 URL/ID、日期、非负整数、公开停留拒绝、统计分母、筛选窗口与投流、价格单位与状态。
- [x] 执行 node --test modules/design-insights/tests/metrics.standalone.test.ts，确认功能缺失导致失败。
- [x] 实现严格输入校验与按风格/形式分组统计，不输出超出样本的判断。
- [x] 重跑测试通过并提交。

### Task 2: 站点行业配置与来源方案

**Files:** site/site.ts、site/pages/、site/brand/、industry/{taxonomy.ts,topics.json,sources.json,prompts/}、docs/design-insights.md、docs/deploy.md、.env.example。

**Interfaces:** 延续现有分类 key；新增装修分类、标签和主题。行业提示词保留 JSON 输出契约与评分五轴七类型权重。

- [x] 替换品牌、文案、领域规则，扩充分类与国内主体；重生成报头与标记。
- [x] RSS 首选，external 隔离审核，默认关闭第三方；文档给出权限、故障降级、升级暂停旧源和校准要求。
- [x] 校验来源配置、主题映射与模板渲染契约，通过后提交。

### Task 3: 可操作页面与验收

**Files:** modules/design-insights/{module.ts,web.tsx,web/*}、site/modules/、site/package.json、package-lock.json、Dockerfile。

**Interfaces:** 消费洞察 /insights 与来源目录 /sources-guide；桌面侧栏、手机与我的入口通过 WebModule 插口。

- [x] 增加内存导入、筛选、统计表、价格证据表与空模板下载；来源目录与首页三线导航。
- [x] 执行 npm run typecheck、npm test、npm run build -w @aihot/web、node --test apps/web/tests/*.test.ts。
- [x] 启动本机无采集站，运行 node scripts/smoke.ts，浏览器验收新增页面及移动导航。
- [ ] 检查差异、提交独立分支、推送并创建草稿 PR；汇报真实检查结果与待定项。（本地验证已完成；新Fork已创建，用户已同意仅授权该仓库，GitHub安装流程要求邮箱身份验证。远端分支与PR待授权完成后创建。）
