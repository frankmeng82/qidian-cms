# Cursor 开发提示词

## 项目概述

**奇点影视CMS (Qidian CMS)** - 现代化的影视内容管理系统，兼容苹果CMS采集生态

- **技术栈**: React 18 + Node.js + PostgreSQL + Redis
- **开发周期**: 6周
- **当前阶段**: Phase 1 - 基础架构 + 视频管理 + 播放器

---

## 核心提示词

### 1. 初始化项目

```
请帮我初始化奇点影视CMS项目，使用以下技术栈：

前端:
- React 18 + TypeScript + Vite
- Ant Design 5 作为UI组件库
- React Router 6 路由管理
- Zustand 状态管理
- Axios HTTP请求
- Video.js 视频播放器

后端:
- Node.js 20 LTS + Express
- TypeScript
- Prisma ORM
- JWT认证
- bcrypt密码加密

要求:
1. 创建项目目录结构
2. 配置TypeScript
3. 配置ESLint和Prettier
4. 创建基础路由和页面
5. 配置开发环境
```

### 2. 数据库设计

```
请帮我设计奇点影视CMS的数据库，使用PostgreSQL。

核心表：
1. videos - 视频信息表
2. video_sources - 播放源表
3. video_episodes - 分集表
4. categories - 分类表（树形结构）
5. tags - 标签表
6. video_tags - 视频标签关联表
7. users - 用户表
8. user_favorites - 用户收藏表
9. user_history - 用户播放历史表
10. collect_rules - 采集规则表

要求：
1. 使用Prisma schema定义
2. 包含字段类型、约束、索引
3. 定义表之间的关系
4. 包含created_at/updated_at审计字段
5. 软删除使用status字段
```

### 3. 视频管理功能

```
请帮我实现视频管理功能，包括：

后端API：
- POST /api/v1/videos - 创建视频
- GET /api/v1/videos - 获取视频列表（分页、筛选）
- GET /api/v1/videos/:id - 获取视频详情
- PUT /api/v1/videos/:id - 更新视频
- DELETE /api/v1/videos/:id - 删除视频（软删除）

前端页面：
- 视频列表页（表格展示、分页、筛选）
- 视频添加/编辑页（表单）
- 视频详情页

要求：
1. 使用Prisma操作数据库
2. 表单验证使用Zod
3. 图片上传使用Multer
4. 错误处理统一封装
```

### 4. 播放器集成

```
请帮我集成Video.js播放器：

功能：
1. 支持m3u8/mp4/flv格式
2. 多线路切换
3. 清晰度选择（480P/720P/1080P/4K）
4. 记忆播放进度
5. 快捷键支持（空格播放/暂停）

要求：
1. 封装VideoPlayer组件
2. 支持props传入播放源
3. 播放进度保存到localStorage
4. 错误时显示友好提示
```

### 5. 用户认证

```
请帮我实现用户认证系统：

后端：
- POST /api/v1/auth/register - 用户注册
- POST /api/v1/auth/login - 用户登录
- POST /api/v1/auth/refresh - Token刷新
- GET /api/v1/user/profile - 获取用户信息


前端：
- 登录页面
- 注册页面
- 路由守卫（未登录跳转登录）
- Token管理（自动刷新）

要求：
1. JWT认证
2. 密码bcrypt加密
3. Token有效期7天
4. 自动刷新（提前1天）
```

### 6. 采集系统

```
请帮我实现采集系统，兼容苹果CMS采集规则：

功能：
1. 解析XML/JSON采集规则
2. 定时执行采集任务
3. 数据去重（标题+年份）
4. 图片自动下载
5. 分类自动匹配

API：
- POST /api/v1/collect/rules - 创建采集规则
- GET /api/v1/collect/rules - 获取规则列表
- POST /api/v1/collect/execute - 执行采集
- GET /api/v1/collect/logs - 获取采集日志

要求：
1. 使用Bull任务队列
2. 支持定时任务（node-cron）
3. 采集频率限制（5分钟间隔）
4. 错误重试机制
```

### 7. 前端页面

```

请帮我创建前端页面：

管理后台：
1. 登录页
2. 布局（侧边栏 + 顶部导航）
3. 视频管理（列表、添加、编辑）
4. 分类管理
5. 采集管理

用户前台：
1. 首页（推荐视频、分类入口）
2. 分类页
3. 视频详情页
4. 播放页
5. 用户中心（收藏、历史）

要求：
1. 使用Ant Design组件
2. 响应式设计
3. 路由配置
4. 状态管理
```

### 8. Docker部署

```
请帮我配置Docker部署：

1. 创建Dockerfile（前端+后端）
2. 创建docker-compose.yml
3. 配置Nginx反向代理
4. 环境变量配置

服务：
- frontend（React）
- backend（Node.js）
- postgres（PostgreSQL）
- redis（Redis）
- nginx（Nginx）

要求：
1. 多阶段构建
2. 环境分离（dev/prod）
3. 数据持久化
4. 网络配置
```

---

## 开发顺序建议

```
Week 1:
1. 项目初始化（Day 1）
2. 数据库设计（Day 1-2）
3. 后端基础架构（Day 2-3）
4. 视频管理API（Day 3-4）
5. 前端基础架构（Day 4-5）
6. 管理后台-视频（Day 5-7）

Week 2:
7. 播放器集成（Day 8-9）
8. 用户认证（Day 9-10）
9. 用户前台（Day 10-11）
10. 采集系统（Day 11-13）
11. 接口联调（Day 13-14）
```

---

## 关键约束

- 视频标题必须唯一
- 分类下必须有内容才能显示
- 采集数据必须去重（按标题+年份）
- VIP视频仅VIP用户可播放- 播放源失效自动隐藏
- 用户密码最小8位，包含字母+数字
- API限流：1000次/分钟/IP
- 采集限流：100条/次，最小间隔5分钟

---

## 参考文档

完整需求文档位置：
`/Users/frank/.openclaw/workspace/projects/qidian-cms/docs/`

包含：
- 01-PROJECT-BRIEF.md - 项目Brief
- 02-PRD.md - 产品需求
- 04-SYSTEM-ARCHITECTURE.md - 系统架构
- 05-DATA-MODEL.md - 数据模型
- 06-API-CONTRACT.md - API契约
- 12-AGENT-TASK-DECOMPOSITION.md - 任务拆解
