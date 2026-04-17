# 奇点影视CMS (Qidian CMS)

React + Node.js + PostgreSQL + Redis 的影视内容管理系统基础工程。

## 快速开始

### 克隆项目

```bash
# SSH方式（推荐）
git clone git@github.com:frankmeng82/qidian-cms.git

# HTTPS方式
git clone https://github.com/frankmeng82/qidian-cms.git
```

### 本地开发

```bash
cd qidian-cms
npm install
cp apps/backend/.env.example apps/backend/.env
npm run prisma:generate --workspace @qidian-cms/backend

# 首次初始化数据库
npx prisma migrate dev --schema apps/backend/prisma/schema.prisma

npm run dev
```

前端默认运行在 `http://localhost:5173`，后端默认运行在 `http://localhost:3000`。

## 已实现模块

- 管理后台：登录/注册、视频管理、分类管理、采集管理
- 用户前台：首页、分类页、视频详情页、播放页、用户中心（收藏/历史）
- 播放器：Video.js + flv.js，支持线路/清晰度切换、播放进度记忆、空格快捷键
- 后端能力：JWT 认证、视频 CRUD、分类 API、收藏与历史、采集队列与日志、搜索 API
- 运维：`docker-compose.yml`、前后端 Dockerfile、Nginx 反向代理配置

## Docker 部署

```bash
docker compose up -d --build
```

- 入口：`http://localhost:8080`
- 服务：`frontend`、`backend`、`postgres`、`redis`、`nginx`

## 宝塔面板部署

详见 [BT_PANEL_DEPLOY.md](./BT_PANEL_DEPLOY.md)

## 详细部署文档

详见 [DEPLOY_DETAILS.md](./DEPLOY_DETAILS.md)

## 测试与CI

```bash
npm run test
```

- 后端：Vitest + Supertest
- 前端：Vitest + Testing Library
- API 集成：`npm run test:api`
- E2E 快速门禁：`npm run test:e2e:smoke`（Playwright Chromium）
- E2E 全量：`npm run test:e2e`（Playwright Chromium）
- E2E 真实链路：`npm run test:e2e:real`（需 `E2E_REAL=true` + PostgreSQL/Redis）
- 远程触发真实链路（GitHub Actions）：
  - `gh workflow run "E2E Real Full Chain" --ref main`
  - `gh run watch $(gh run list --workflow "E2E Real Full Chain" --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status`
- 性能：`npm run test:perf`（k6）
- 安全冒烟：`npm run test:security`
- CI：`.github/workflows/ci.yml` 执行 `lint + unit + api + e2e-smoke + build`，并在 `main/schedule` 运行全量 E2E
- 真实全链路 CI：`.github/workflows/e2e-real.yml`（手动触发）

## 项目文档

- [项目Brief](./docs/01-PROJECT-BRIEF.md)
- [产品需求PRD](./docs/02-PRD.md)
- [系统架构](./docs/04-SYSTEM-ARCHITECTURE.md)
- [数据模型](./docs/05-DATA-MODEL.md)
- [API契约](./docs/06-API-CONTRACT.md)
- [OpenAPI规范](./docs/13-OPENAPI.yaml)

## 技术栈

- **Frontend**: React 18 + TypeScript + Vite + Ant Design
- **Backend**: Node.js 20 + Express + Prisma
- **Database**: PostgreSQL 15 + Redis 7
- **Testing**: Vitest + Playwright + k6
- **Deploy**: Docker + Nginx + PM2

## 许可证

MIT

## 作者

frankmeng82
