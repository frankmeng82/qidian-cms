# 宝塔面板部署指南 - 奇点影视CMS

## 环境要求

- 服务器：Linux (CentOS 7+/Ubuntu 18.04+)
- 内存：建议 2GB+
- 磁盘：建议 20GB+

---

## 方式一：Docker部署（推荐）

### 1. 宝塔安装Docker

```bash
# 登录宝塔面板
# 软件商店 → 搜索 "Docker" → 安装 "Docker管理器"
```

### 2. 上传项目

```bash
# 将项目压缩包上传到服务器
# 文件管理 → 上传 qidian-cms.zip
# 解压到 /www/wwwroot/qidian-cms
```

### 3. 配置Docker Compose

```bash
# 进入项目目录
cd /www/wwwroot/qidian-cms

# 修改 docker-compose.yml 的端口（避免冲突）
# 将 8080 改为 8888 或其他未使用端口
```

### 4. 启动服务

```bash
# 宝塔终端执行
docker-compose up -d --build

# 查看运行状态
docker-compose ps
```

### 5. 宝塔站点配置

```
1. 网站 → 添加站点
2. 域名：your-domain.com
3. 根目录：/www/wwwroot/qidian-cms
4. 类型：反向代理
5. 目标URL：http://127.0.0.1:8080
```

---

## 方式二：手动部署（传统方式）

### 1. 宝塔安装环境

```
软件商店安装：
- Node.js版本管理器（安装Node 20）
- PostgreSQL（15版本）
- Redis（7版本）
- Nginx
```

### 2. 创建数据库

```bash
# 宝塔数据库 → 添加数据库
# 数据库名：qidian_cms
# 用户名：qidian_user
# 密码：your_secure_password
```

### 3. 上传项目

```bash
# 上传项目到 /www/wwwroot/qidian-cms
# 解压
```

### 4. 安装依赖

```bash
cd /www/wwwroot/qidian-cms

# 安装依赖
npm install

# 生成Prisma客户端
npm run prisma:generate --workspace @qidian-cms/backend

# 执行数据库迁移
npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
```

### 5. 配置环境变量

```bash
# 创建后端环境文件
cp apps/backend/.env.example apps/backend/.env

# 编辑 .env 文件
nano apps/backend/.env
```

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://qidian_user:your_password@localhost:5432/qidian_cms?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

### 6. 构建项目

```bash
# 构建后端
npm run build --workspace @qidian-cms/backend

# 构建前端
npm run build --workspace @qidian-cms/frontend
```

### 7. 配置PM2守护

```bash
# 宝塔安装PM2管理器

# 启动后端
pm2 start apps/backend/dist/server.js --name qidian-backend

# 保存PM2配置
pm2 save
pm2 startup
```

### 8. 配置Nginx

```bash
# 宝塔网站 → 添加站点
# 域名：your-domain.com
# 根目录：/www/wwwroot/qidian-cms/apps/frontend/dist
```

**Nginx配置：**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /www/wwwroot/qidian-cms/apps/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 方式三：宝塔Docker Compose一键部署

### 1. 创建Docker Compose项目

```bash
# 宝塔面板 → Docker → 创建项目
# 项目路径：/www/wwwroot/qidian-cms
```

### 2. 使用已有docker-compose.yml

```bash
# 直接上传项目文件
# Docker管理器会自动识别 docker-compose.yml
```

### 3. 配置域名

```
1. 网站 → 添加站点
2. 域名：your-domain.com
3. 反向代理 → http://127.0.0.1:8080
```

---

## SSL证书配置

### 宝塔一键SSL

```
1. 网站 → 选择站点 → SSL
2. Let's Encrypt → 申请证书
3. 开启强制HTTPS
```

### 手动配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /www/server/panel/vhost/cert/your-domain.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/your-domain.com/privkey.pem;
    
    # 其他配置...
}
```

---

## 常见问题

### 1. 数据库连接失败

```bash
# 检查PostgreSQL是否启动
systemctl status postgresql

# 检查防火墙
bt default  # 查看宝塔端口

# 检查数据库用户权限
```

### 2. Redis连接失败

```bash
# 检查Redis是否启动
systemctl status redis

# 检查Redis密码配置
```

### 3. 端口冲突

```bash
# 修改docker-compose.yml中的端口
# 或修改 .env 中的 PORT
```

### 4. 权限问题

```bash
# 设置目录权限
chown -R www:www /www/wwwroot/qidian-cms
chmod -R 755 /www/wwwroot/qidian-cms
```

---

## 备份策略

### 宝塔计划任务

```
1. 计划任务 → 添加任务
2. 任务类型：备份数据库
3. 执行周期：每天 凌晨2点
4. 备份保留：30份
```

### 手动备份

```bash
# 备份数据库
pg_dump -U qidian_user qidian_cms > backup_$(date +%Y%m%d).sql

# 备份上传文件
tar -czvf uploads_backup_$(date +%Y%m%d).tar.gz apps/backend/uploads/
```

---

## 监控与日志

### 宝塔监控

```
1. 监控 → 添加监控
2. 监控项目：
   - CPU使用率
   - 内存使用率
   - 磁盘使用率
   - 网站访问日志
```

### 查看日志

```bash
# Docker方式
docker-compose logs -f backend
docker-compose logs -f frontend

# PM2方式
pm2 logs qidian-backend

# Nginx日志
/www/wwwlogs/your-domain.com.log
```

---

## 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 安装依赖
npm install

# 3. 执行迁移
npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma

# 4. 重新构建
npm run build

# 5. 重启服务
pm2 restart qidian-backend
# 或
docker-compose up -d --build
```

---

## 快速检查清单

- [ ] Node.js 20已安装
- [ ] PostgreSQL 15已安装
- [ ] Redis 7已安装
- [ ] Nginx已配置
- [ ] 数据库已创建
- [ ] 环境变量已配置
- [ ] 项目已构建
- [ ] 服务已启动
- [ ] 域名已解析
- [ ] SSL证书已配置
- [ ] 防火墙端口已开放

---

## 技术支持

- 项目文档：`/docs/`
- API文档：`/docs/13-OPENAPI.yaml`
- QA指南：`/docs/14-QA-EXECUTION-GUIDE.md`
