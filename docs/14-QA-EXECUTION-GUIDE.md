# QA 执行指南（已落地）

## 1. 单元测试

- 后端：Vitest（`apps/backend`）
- 前端：Vitest + Testing Library（`apps/frontend`）
- 运行命令：

```bash
npm run test:unit
```

## 2. API 集成测试

- 使用 Supertest，已覆盖核心接口成功/失败/鉴权场景
- 运行命令：

```bash
npm run test:api
```

真实数据库隔离集成测试（需 PostgreSQL + Redis）：

```bash
export REAL_API_TESTS=true
export DATABASE_URL="postgresql://test:test@localhost:5432/qidian_test?schema=public"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="test_secret_123456"
npx prisma db push --schema apps/backend/prisma/schema.prisma
npm run test:api:real
```

## 3. 安全冒烟测试

- 覆盖未授权访问、SQL-like 输入、XSS-like 输入
- 运行命令：

```bash
npm run test:security
```

## 4. E2E 测试（Playwright）

- 已采用 Page Object 模式并提供多场景用例
- 场景文件位于：`tests/e2e`
- 运行命令：

```bash
npx playwright install chromium
npm run test:e2e
```

快速冒烟（关键链路，Chromium）：

```bash
npm run test:e2e:smoke
```

CI 用（与 smoke 同步）：

```bash
npm run test:e2e:ci
```

全浏览器执行：

```bash
npm run test:e2e:all
```

真实后端全链路（注册→登录→后台建视频→播放→收藏/历史）：

```bash
export E2E_REAL=true
export DATABASE_URL="postgresql://test:test@localhost:5432/qidian_test?schema=public"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="test_secret_123456"
npx prisma db push --schema apps/backend/prisma/schema.prisma
npm run test:e2e:real
```

GitHub Actions 一键触发（推荐做回归留痕）：

```bash
gh workflow run "E2E Real Full Chain" --ref main
gh run watch $(gh run list --workflow "E2E Real Full Chain" --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

## 5. 覆盖率报告

- 后端/前端均启用 coverage 报告输出（html + text）
- 阈值：lines/functions/branches/statements = 80%
- 运行命令：

```bash
npm run test:coverage
```

## 6. 性能测试

- k6 脚本：`tests/performance/videos-api.k6.js`
- 运行命令：

```bash
npm run test:perf
```

## 7. CI 自动化

- 工作流：
  - `.github/workflows/ci.yml`（常规 CI）
  - `.github/workflows/e2e-real.yml`（手动真实全链路）
- 包含：
  - lint
  - unit test
  - coverage
  - security smoke
  - dependency audit
  - build
  - api integration
  - api integration (real db)
  - e2e smoke (chromium, push/PR 快速门禁)
  - e2e chromium（仅 main 分支 + schedule 全量回归）
  - e2e chromium real（独立 `E2E Real Full Chain` 工作流手动触发）
  - artifact 上传（coverage + playwright report）
