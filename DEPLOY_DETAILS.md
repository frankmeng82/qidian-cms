# 部署细节 - 奇点影视CMS

## 目录

1. [服务器准备](#1-服务器准备)
2. [宝塔面板配置](#2-宝塔面板配置)
3. [Docker部署详解](#3-docker部署详解)
4. [手动部署详解](#4-手动部署详解)
5. [Nginx配置详解](#5-nginx配置详解)
6. [数据库配置详解](#6-数据库配置详解)
7. [SSL证书配置](#7-ssl证书配置)
8. [性能优化](#8-性能优化)
9. [安全加固](#9-安全加固)
10. [监控告警](#10-监控告警)
11. [故障排查](#11-故障排查)

---

## 1. 服务器准备

### 1.1 推荐配置

| 项目 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 2核 | 4核+ |
| 内存 | 2GB | 4GB+ |
| 磁盘 | 40GB SSD | 100GB SSD |
| 带宽 | 3Mbps | 5Mbps+ |
| 系统 | CentOS 7.6+ / Ubuntu 18.04+ |

### 1.2 系统初始化

```bash
# 更新系统
yum update -y  # CentOS
apt update && apt upgrade -y  # Ubuntu

# 设置时区
timedatectl set-timezone Asia/Shanghai

# 安装基础工具
yum install -y wget curl vim git  # CentOS
apt install -y wget curl vim git  # Ubuntu

# 配置防火墙
systemctl start firewalld
systemctl enable firewalld
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=8888/tcp  # 宝塔面板
firewall-cmd --reload
```

### 1.3 域名解析

```
A记录: your-domain.com → 服务器IP
A记录: www.your-domain.com → 服务器IP
```

---

## 2. 宝塔面板配置

### 2.1 安装宝塔

```bash
# CentOS
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh ed8484bec

# Ubuntu
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh ed8484bec
```

### 2.2 初始化配置

```
1. 访问: http://服务器IP:8888
2. 使用安装完成时显示的账号密码登录
3. 绑定宝塔账号
4. 安装推荐套件:
   - Nginx 1.24
   - MySQL 8.0 (可选,我们用PostgreSQL)
   - PHP 8.0 (可选)
   - phpMyAdmin (可选)
```

### 2.3 安装必要软件

```bash
# 方式1: 宝塔面板安装
软件商店 → 搜索安装:
- Docker管理器
- Node.js版本管理器
- PostgreSQL管理器

# 方式2: 命令行安装
bt default install docker
bt default install node
```

---

## 3. Docker部署详解

### 3.1 安装Docker

```bash
# 宝塔面板 → 软件商店 → Docker管理器 → 安装

# 或手动安装
curl -fsSL https://get.docker.com | bash
systemctl start docker
systemctl enable docker

# 安装Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 3.2 上传项目

```bash
# 方式1: Git克隆
cd /www/wwwroot
git clone https://github.com/frankmeng82/qidian-cms.git

# 方式2: 上传压缩包
# 宝塔文件管理器 → 上传 → 解压
```

### 3.3 修改配置

```bash
cd /www/wwwroot/qidian-cms

# 修改docker-compose.yml
vim docker-compose.yml
```

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: qidian-postgres
    environment:
      POSTGRES_DB: qidian_cms
      POSTGRES_USER: qidian_user
      POSTGRES_PASSWORD: your_secure_password_here  # 修改密码
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups  # 备份目录
    ports:
      - '127.0.0.1:5432:5432'  # 仅本地访问
    networks:
      - qidian-net
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U qidian_user -d qidian_cms"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: qidian-redis
    command: redis-server --requirepass your_redis_password  # 设置密码
    volumes:
      - redis_data:/data
    ports:
      - '127.0.0.1:6379:6379'  # 仅本地访问
    networks:
      - qidian-net
    restart: always

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    container_name: qidian-backend
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://qidian_user:your_secure_password_here@postgres:5432/qidian_cms?schema=public
      REDIS_URL: redis://:your_redis_password@redis:6379
      JWT_SECRET: your_jwt_secret_key_min_32_chars
      JWT_EXPIRES_IN: 7d
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - qidian-net
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    container_name: qidian-frontend
    depends_on:
      - backend
    networks:
      - qidian-net
    restart: always

  nginx:
    image: nginx:1.27-alpine
    container_name: qidian-nginx
    depends_on:
      - frontend
      - backend
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro  # SSL证书目录
      - ./logs/nginx:/var/log/nginx  # 日志目录
    ports:
      - '80:80'
      - '443:443'
    networks:
      - qidian-net
    restart: always

volumes:
  postgres_data:
  redis_data:

networks:
  qidian-net:
    driver: bridge
```

### 3.4 启动服务

```bash
# 首次启动（构建镜像）
docker-compose up -d --build

# 查看启动日志
docker-compose logs -f

# 检查服务状态
docker-compose ps

# 查看资源使用
docker stats
```

### 3.5 初始化数据库

```bash
# 执行数据库迁移
docker-compose exec backend npx prisma migrate deploy

# 查看迁移状态
docker-compose exec backend npx prisma migrate status
```

---

## 4. 手动部署详解

### 4.1 安装Node.js

```bash
# 宝塔面板 → 软件商店 → Node.js版本管理器 → 安装v20

# 或手动安装
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 验证安装
node -v  # v20.x.x
npm -v   # 10.x.x
```

### 4.2 安装PostgreSQL

```bash
# 宝塔面板 → 软件商店 → PostgreSQL管理器 → 安装v15

# 或手动安装
# 添加仓库
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt-get update
apt-get install -y postgresql-15

# 启动服务
systemctl start postgresql
systemctl enable postgresql
```

### 4.3 安装Redis

```bash
# 宝塔面板 → 软件商店 → Redis → 安装v7

# 或手动安装
apt-get install -y redis-server

# 配置密码
vim /etc/redis/redis.conf
# 找到 # requirepass foobared
# 改为: requirepass your_redis_password

# 重启
systemctl restart redis-server
```

### 4.4 安装PM2

```bash
npm install -g pm2

# 配置PM2开机启动
pm2 startup
```

### 4.5 部署后端

```bash
cd /www/wwwroot/qidian-cms

# 安装依赖
npm install

# 配置环境变量
cp apps/backend/.env.example apps/backend/.env
vim apps/backend/.env
```

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://qidian_user:password@localhost:5432/qidian_cms?schema=public
REDIS_URL=redis://:password@localhost:6379
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRES_IN=7d
```

```bash
# 生成Prisma客户端
npm run prisma:generate --workspace @qidian-cms/backend

# 执行数据库迁移
npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma

# 构建
npm run build --workspace @qidian-cms/backend

# 启动（使用PM2）
pm2 start apps/backend/dist/server.js --name qidian-backend

# 保存PM2配置
pm2 save
```

### 4.6 部署前端

```bash
# 构建前端
npm run build --workspace @qidian-cms/frontend

# 前端静态文件在 apps/frontend/dist
```

---

## 5. Nginx配置详解

### 5.1 宝塔站点配置

```bash
# 方式1: 宝塔面板
网站 → 添加站点 → 域名 → 根目录选择前端dist

# 方式2: 命令行
bt default site add --domain your-domain.com --path /www/wwwroot/qidian-cms/apps/frontend/dist
```

### 5.2 Nginx配置文件

```nginx
# /www/server/panel/vhost/nginx/your-domain.com.conf

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 强制HTTPS（配置SSL后启用）
    # return 301 https://$server_name$request_uri;
    
    # 前端静态文件
    location / {
        root /www/wwwroot/qidian-cms/apps/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 缓冲区设置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        
        # 请求头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket支持（如果需要）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # 上传文件大小限制
    client_max_body_size 100M;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 日志
    access_log /www/wwwlogs/your-domain.com.log;
    error_log /www/wwwlogs/your-domain.com.error.log;
}

# HTTPS配置（SSL证书配置后启用）
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL证书
    ssl_certificate /www/server/panel/vhost/cert/your-domain.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/your-domain.com/privkey.pem;
    
    # SSL优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 其他配置同上...
}
```

### 5.3 重载Nginx

```bash
# 测试配置
nginx -t

# 重载
/etc/init.d/nginx reload
# 或
systemctl reload nginx
```

---

## 6. 数据库配置详解

### 6.1 创建数据库

```bash
# 登录PostgreSQL
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE qidian_cms;
CREATE USER qidian_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE qidian_cms TO qidian_user;
ALTER DATABASE qidian_cms OWNER TO qidian_user;

# 退出
\q
```

### 6.2 数据库优化

```sql
-- 连接数优化
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '768MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET work_mem = '4MB';

-- 重启生效
-- sudo systemctl restart postgresql
```

### 6.3 定期维护

```bash
# 创建维护脚本
vim /www/wwwroot/qidian-cms/scripts/db-maintenance.sh
```

```bash
#!/bin/bash
# 数据库维护脚本

# 自动清理和分析
sudo -u postgres psql -d qidian_cms -c "VACUUM ANALYZE;"

# 备份
pg_dump -U qidian_user qidian_cms > "/www/backup/qidian_cms_$(date +%Y%m%d).sql"

# 删除7天前的备份
find /www/backup -name "qidian_cms_*.sql" -mtime +7 -delete
```

---

## 7. SSL证书配置

### 7.1 宝塔一键SSL

```
1. 网站 → 选择站点 → SSL
2. Let's Encrypt → 申请证书
3. 勾选: 自动续签、强制HTTPS
4. 保存
```

### 7.2 手动配置（acme.sh）

```bash
# 安装acme.sh
curl https://get.acme.sh | sh

# 申请证书
~/.acme.sh/acme.sh --issue -d your-domain.com -d www.your-domain.com --nginx

# 安装证书
~/.acme.sh/acme.sh --install-cert -d your-domain.com \
    --key-file /www/server/panel/vhost/cert/your-domain.com/privkey.pem \
    --fullchain-file /www/server/panel/vhost/cert/your-domain.com/fullchain.pem \
    --reloadcmd "/etc/init.d/nginx reload"

# 自动续期（已默认启用）
```

---

## 8. 性能优化

### 8.1 Node.js优化

```bash
# 环境变量
export NODE_ENV=production
export UV_THREADPOOL_SIZE=128

# PM2配置
vim ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'qidian-backend',
    script: './apps/backend/dist/server.js',
    instances: 'max',  // 根据CPU核心数
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    // 内存限制
    max_memory_restart: '1G',
    // 日志
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // 自动重启
    min_uptime: '10s',
    max_restarts: 5,
    // 监控
    monitoring: true
  }]
};
```

### 8.2 PostgreSQL优化

```sql
-- /etc/postgresql/15/main/postgresql.conf

# 内存
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# 连接
max_connections = 200

# WAL
wal_buffers = 16MB
min_wal_size = 1GB
max_wal_size = 4GB

# 查询优化
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 8.3 Nginx优化

```nginx
# /etc/nginx/nginx.conf

worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # 基础优化
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;
    
    # 缓存
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}
```

---

## 9. 安全加固

### 9.1 防火墙配置

```bash
# 宝塔面板 → 安全 → 防火墙

# 或命令行
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --remove-service=ssh  # 如果修改了SSH端口
firewall-cmd --permanent --add-port=你的SSH端口/tcp
firewall-cmd --reload
```

### 9.2 修改SSH端口

```bash
vim /etc/ssh/sshd_config
# Port 22 → Port 你的端口

systemctl restart sshd
```

### 9.3 禁用root登录

```bash
vim /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no  # 使用密钥登录

systemctl restart sshd
```

### 9.4 安装Fail2ban

```bash
apt-get install -y fail2ban

vim /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
```

```bash
systemctl restart fail2ban
```

### 9.5 定期安全扫描

```bash
# 安装ClamAV
apt-get install -y clamav clamav-daemon

# 更新病毒库
freshclam

# 全盘扫描
clamscan -r /www/wwwroot
```

---

## 10. 监控告警

### 10.1 宝塔监控

```
宝塔面板 → 监控 → 添加监控项目:
- CPU使用率
- 内存使用率
- 磁盘使用率
- 网站访问日志
```

### 10.2 配置告警

```bash
# 安装钉钉/企业微信通知脚本
vim /www/wwwroot/qidian-cms/scripts/alert.sh
```

```bash
#!/bin/bash
# 告警脚本

WEBHOOK_URL="你的钉钉机器人Webhook"
MESSAGE="$1"

curl -s "$WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "{\"msgtype\": \"text\", \"text\": {\"content\": \"$MESSAGE\"}}"
```

### 10.3 资源监控脚本

```bash
vim /www/wwwroot/qidian-cms/scripts/resource-monitor.sh
```

```bash
#!/bin/bash

# 检查磁盘
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    ./alert.sh "警告: 磁盘使用率 ${DISK_USAGE}%"
fi

# 检查内存
MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ "$MEM_USAGE" -gt 90 ]; then
    ./alert.sh "警告: 内存使用率 ${MEM_USAGE}%"
fi

# 检查服务
if ! pgrep -f "qidian-backend" > /dev/null; then
    ./alert.sh "警告: 后端服务已停止"
    pm2 restart qidian-backend
fi
```

### 10.4 添加定时任务

```bash
# 宝塔面板 → 计划任务

# 或命令行
crontab -e

# 添加:
# 每5分钟检查资源
*/5 * * * * /www/wwwroot/qidian-cms/scripts/resource-monitor.sh

# 每天凌晨3点备份
0 3 * * * /www/wwwroot/qidian-cms/scripts/backup.sh

# 每周一清理日志
0 4 * * 1 find /www/wwwlogs -name "*.log" -mtime +30 -delete
```

---

## 11. 故障排查

### 11.1 服务无法启动

```bash
# 查看Docker日志
docker-compose logs -f backend

# 查看PM2日志
pm2 logs qidian-backend

# 检查端口占用
netstat -tlnp | grep 3000

# 检查环境变量
cat apps/backend/.env
```

### 11.2 数据库连接失败

```bash
# 检查PostgreSQL状态
systemctl status postgresql

# 检查连接
psql -U qidian_user -d qidian_cms -h localhost

# 检查防火墙
firewall-cmd --list-ports
```

### 11.3 502错误

```bash
# 检查后端服务
curl http://127.0.0.1:3000/health

# 检查Nginx错误日志
tail -f /www/wwwlogs/your-domain.com.error.log

# 检查Nginx配置
nginx -t
```

### 11.4 性能问题

```bash
# 查看资源使用
top
htop

# 查看数据库慢查询
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# 查看Redis
redis-cli INFO

# 查看Node.js内存
pm2 monit
```

### 11.5 日志分析

```bash
# 实时查看日志
tail -f /www/wwwlogs/your-domain.com.log | grep "500"

# 统计错误数量
grep "500" /www/wwwlogs/your-domain.com.log | wc -l

# 查看最近错误
grep "ERROR" /www/wwwroot/qidian-cms/logs/error.log | tail -20
```

---

## 附录

### A. 常用命令速查

```bash
# Docker
docker-compose up -d              # 启动
docker-compose down               # 停止
docker-compose restart            # 重启
docker-compose logs -f [service]  # 查看日志
docker-compose ps                 # 查看状态
docker system prune -f            # 清理无用镜像

# PM2
pm2 start app.js --name app       # 启动
pm2 stop app                      # 停止
pm2 restart app                   # 重启
pm2 delete app                    # 删除
pm2 logs app                      # 查看日志
pm2 monit                         # 监控
pm2 save                          # 保存配置
pm2 startup                       # 开机启动

# PostgreSQL
sudo -u postgres psql             # 登录
\l                                # 列出数据库
\c database                       # 切换数据库
\dt                               # 列出表
\q                                # 退出

# Nginx
nginx -t                          # 测试配置
nginx -s reload                   # 重载
nginx -s stop                     # 停止
nginx                             # 启动
```

### B. 文件权限

```bash
# 项目目录权限
chown -R www:www /www/wwwroot/qidian-cms
chmod -R 755 /www/wwwroot/qidian-cms

# 上传目录权限
chmod -R 777 /www/wwwroot/qidian-cms/apps/backend/uploads

# 日志目录权限
chmod -R 755 /www/wwwroot/qidian-cms/logs
```

### C. 备份恢复

```bash
# 备份数据库
pg_dump -U qidian_user qidian_cms > backup.sql

# 恢复数据库
psql -U qidian_user -d qidian_cms < backup.sql

# 备份整个项目
tar -czvf qidian-cms-backup.tar.gz /www/wwwroot/qidian-cms

# 恢复项目
tar -xzvf qidian-cms-backup.tar.gz -C /www/wwwroot/
```

---

**文档版本**: v1.0  
**最后更新**: 2026-04-16  
**适用系统**: CentOS 7+/Ubuntu 18.04+  
**宝塔版本**: 7.x+