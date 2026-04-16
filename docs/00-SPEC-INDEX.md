# 需求文档总索引

## 项目基本信息

- **项目名称**：奇点影视CMS (Qidian CMS)
- **项目代号**：qidian-cms
- **文档负责人**：OpenClaw
- **最后更新时间**：2026-04-16
- **当前阶段**：`development`

## 文档状态表

| 文档 | 状态 | 负责人 | 是否阻塞开发 | 备注 |
|---|---|---|---|---|
| 01-PROJECT-BRIEF.md | ✅ 已完成 | gstack-agent | 是 | 项目Brief已填写 |
| 02-PRD.md | ✅ 已完成 | gstack-agent | 是 | PRD已完成 |
| 03-USER-FLOWS.md | ✅ 已完成 | gstack-agent | 是 | 用户流程已完成 |
| 04-SYSTEM-ARCHITECTURE.md | ✅ 已完成 | gstack-agent | 是 | 架构设计已完成 |
| 05-DATA-MODEL.md | ✅ 已完成 | gstack-agent | 是 | 数据模型已完成 |
| 06-API-CONTRACT.md | ✅ 已完成 | gstack-agent | 是 | API契约已完成 |
| 07-UI-UX-SPEC.md | ✅ 已完成 | gstack-agent | 是 | UI/UX规范已完成 |
| 08-NON-FUNCTIONAL-REQUIREMENTS.md | ✅ 已完成 | gstack-agent | 是 | 非功能需求已完成 |
| 09-TEST-ACCEPTANCE.md | ✅ 已完成 | gstack-agent | 是 | 测试验收已完成 |
| 10-DELIVERY-PLAN.md | ✅ 已完成 | gstack-agent | 是 | 交付计划已完成 |
| 11-RISKS-OPEN-QUESTIONS.md | ✅ 已完成 | gstack-agent | 是 | 风险分析已完成 |
| 12-AGENT-TASK-DECOMPOSITION.md | ✅ 已完成 | gstack-agent | 是 | Agent任务拆解已完成 |
| 13-OPENAPI.yaml | ✅ 已完成 | Codex | 否 | 当前实现API定义（OpenAPI 3.0） |
| 14-QA-EXECUTION-GUIDE.md | ✅ 已完成 | Codex | 否 | QA执行命令与流水线说明 |

## 当前 blocker

✅ **所有Blocker已解决**

- ✅ 苹果CMS数据库兼容：最好兼容，提供迁移工具
- ✅ 播放器DRM：不需要，兼容现有播放器即可
- ✅ VIP体系：已设计（普通/VIP/SVIP三等级）

## 当前可推进内容

✅ **所有核心文档已完成，可进入开发阶段**

- 01-PROJECT-BRIEF.md ✅ 可评审
- 02-PRD.md ✅ 可评审
- 03-USER-FLOWS.md ✅ 可评审
- 04-SYSTEM-ARCHITECTURE.md ✅ 可评审
- 05-DATA-MODEL.md ✅ 可评审
- 06-API-CONTRACT.md ✅ 可评审
- 07-UI-UX-SPEC.md ✅ 可评审
- 08-NON-FUNCTIONAL-REQUIREMENTS.md ✅ 可评审
- 09-TEST-ACCEPTANCE.md ✅ 可评审
- 10-DELIVERY-PLAN.md ✅ 可评审
- 11-RISKS-OPEN-QUESTIONS.md ✅ 可评审
- 12-AGENT-TASK-DECOMPOSITION.md ✅ 可评审

## 项目概述

**目标**：打造现代化的影视内容管理系统，兼容苹果CMS采集生态

**技术栈**：React + Node.js + PostgreSQL + Redis

**核心功能**：
- 视频管理（多播放源、分集）
- 采集系统（兼容苹果CMS规则）
- 播放器（多线路、记忆播放）
- 用户系统（注册登录、收藏历史）

**开发周期**：6周

**参考项目**：苹果CMS v10 (maccms10)

**交付计划**：
- Phase 1（2周）：基础架构 + 视频管理 + 播放器
- Phase 2（2周）：用户系统 + 采集系统 + 搜索
- Phase 3（1周）：优化 + 测试 + 文档
- Phase 4（1周）：部署 + 上线 + 监控

**VIP体系**：
- 普通会员：免费视频，480P
- VIP会员：VIP视频，1080P，无广告，29元/月
- SVIP会员：全部视频，4K，优先播放，59元/月

## 下一步行动

1. **文档评审**：相关方评审需求文档
2. **技术选型确认**：确认最终技术栈
3. **启动Phase 1开发**：基础架构搭建
