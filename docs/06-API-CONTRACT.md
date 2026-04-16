# API 契约

## 1. 接口列表

### 1.1 内容接口

| 接口名 | 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|---|
| 视频列表 | GET | /api/v1/videos | 分页获取视频列表 | 否 |
| 视频详情 | GET | /api/v1/videos/:id | 获取视频详情 | 否 |
| 创建视频 | POST | /api/v1/videos | 创建新视频 | 管理员 |
| 更新视频 | PUT | /api/v1/videos/:id | 更新视频信息 | 管理员 |
| 删除视频 | DELETE | /api/v1/videos/:id | 删除视频 | 管理员 |
| 分类列表 | GET | /api/v1/categories | 获取分类树 | 否 |
| 标签列表 | GET | /api/v1/tags | 获取标签列表 | 否 |
| 搜索视频 | GET | /api/v1/search | 搜索视频 | 否 |

### 1.2 用户接口

| 接口名 | 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|---|
| 用户注册 | POST | /api/v1/auth/register | 用户注册 | 否 |
| 用户登录 | POST | /api/v1/auth/login | 用户登录 | 否 |
| 获取用户信息 | GET | /api/v1/user/profile | 获取当前用户信息 | 用户 |
| 更新用户信息 | PUT | /api/v1/user/profile | 更新用户信息 | 用户 |
| 用户收藏 | GET | /api/v1/user/favorites | 获取收藏列表 | 用户 |
| 添加收藏 | POST | /api/v1/user/favorites | 添加收藏 | 用户 |
| 取消收藏 | DELETE | /api/v1/user/favorites/:id | 取消收藏 | 用户 |
| 播放历史 | GET | /api/v1/user/history | 获取播放历史 | 用户 |
| 更新播放进度 | POST | /api/v1/user/history | 更新播放进度 | 用户 |

### 1.3 采集接口

| 接口名 | 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|---|
| 采集规则列表 | GET | /api/v1/collect/rules | 获取采集规则 | 管理员 |
| 创建采集规则 | POST | /api/v1/collect/rules | 创建规则 | 管理员 |
| 更新采集规则 | PUT | /api/v1/collect/rules/:id | 更新规则 | 管理员 |
| 删除采集规则 | DELETE | /api/v1/collect/rules/:id | 删除规则 | 管理员 |
| 执行采集 | POST | /api/v1/collect/execute | 手动执行采集 | 管理员 |
| 采集日志 | GET | /api/v1/collect/logs | 获取采集日志 | 管理员 |

### 1.4 播放接口

| 接口名 | 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|---|
| 获取播放信息 | GET | /api/v1/videos/:id/play | 获取播放源 | 否 |
| 上报播放进度 | POST | /api/v1/videos/:id/progress | 上报进度 | 用户 |

## 2. 接口详细定义

### 2.1 视频列表

- **方法**：GET
- **路径**：`/api/v1/videos`
- **说明**：分页获取视频列表
- **调用方**：前端
- **鉴权**：否

#### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| page | integer | 否 | 页码，默认1 |
| limit | integer | 否 | 每页数量，默认20，最大100 |
| category_id | integer | 否 | 分类ID筛选 |
| tag | string | 否 | 标签筛选 |
| year | integer | 否 | 年份筛选 |
| keyword | string | 否 | 关键词搜索 |
| sort | string | 否 | 排序：newest/hottest/recommend |

#### 响应参数

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "视频标题",
        "subtitle": "副标题",
        "cover_image": "https://...",
        "category": {
          "id": 1,
          "name": "电影"
        },
        "year": 2026,
        "hits": 1000,
        "is_vip": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### 2.2 视频详情

- **方法**：GET
- **路径**：`/api/v1/videos/:id`
- **说明**：获取视频详情
- **调用方**：前端
- **鉴权**：否

#### 响应参数

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "title": "视频标题",
    "subtitle": "副标题",
    "description": "视频简介...",
    "cover_image": "https://...",
    "category": {
      "id": 1,
      "name": "电影",
      "slug": "movie"
    },
    "tags": ["动作", "科幻"],
    "year": 2026,
    "area": "美国",
    "lang": "英语",
    "director": "导演名",
    "actors": "演员1,演员2",
    "duration": 120,
    "hits": 1000,
    "is_vip": false,
    "sources": [
      {
        "id": 1,
        "name": "蓝光",
        "url": "https://...",
        "type": "m3u8"
      }
    ],
    "episodes": [
      {
        "id": 1,
        "episode_number": 1,
        "title": "第一集",
        "sources": [...]
      }
    ],
    "created_at": "2026-04-15T10:00:00Z"
  }
}
```

### 2.3 用户登录

- **方法**：POST
- **路径**：`/api/v1/auth/login`
- **说明**：用户登录
- **调用方**：前端
- **鉴权**：否

#### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| username | string | 是 | 用户名/邮箱/手机号 |
| password | string | 是 | 密码 |

#### 响应参数

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "user1",
      "avatar": "https://...",
      "vip_level": 0
    }
  }
}
```

### 2.4 执行采集

- **方法**：POST
- **路径**：`/api/v1/collect/execute`
- **说明**：手动执行采集任务
- **调用方**：管理后台
- **鉴权**：管理员

#### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| rule_id | integer | 是 | 采集规则ID |
| page | integer | 否 | 采集页码，默认1 |
| limit | integer | 否 | 每页数量，默认100 |

#### 响应参数

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_id": "collect-123456",
    "status": "running",
    "message": "采集任务已启动"
  }
}
```

## 3. 非功能约束

### 3.1 通用约束

- **超时**：所有接口超时30秒
- **重试**：失败后可重试3次
- **幂等**：POST请求需保证幂等性（使用唯一ID）
- **限流**：
  - 普通接口：1000次/分钟/IP
  - 采集接口：10次/分钟/管理员

### 3.2 分页规范

- **默认页码**：1
- **默认每页**：20条
- **最大每页**：100条
- **返回格式**：
  ```json
  {
    "list": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
  ```

### 3.3 错误码规范

| 错误码 | 场景 | 前端处理建议 |
|---|---|---|
| 0 | 成功 | - |
| 400 | 参数错误 | 提示用户检查输入 |
| 401 | 未授权 | 跳转登录页 |
| 403 | 无权限 | 提示无权限 |
| 404 | 资源不存在 | 显示404页面 |
| 429 | 请求过于频繁 | 提示稍后重试 |
| 500 | 服务器错误 | 提示系统繁忙 |

### 3.4 鉴权规范

- **Token位置**：Header `Authorization: Bearer {token}`
- **Token有效期**：7天
- **刷新机制**：自动刷新（提前1天）

### 3.5 排序规范

- **字段**：sort=field:order
- **order**：asc（升序）/ desc（降序）
- **示例**：`sort=created_at:desc`
