#!/bin/bash
# 更新部署脚本

set -e

PROJECT_DIR="/www/wwwroot/qidian-cms"
DEPLOY_MODE="${1:-docker}"

echo "========================================"
echo "奇点影视CMS - 更新部署"
echo "========================================"

cd "$PROJECT_DIR"

echo "[1/5] 拉取最新代码..."
git pull origin main

echo "[2/5] 安装依赖..."
npm install

echo "[3/5] 执行数据库迁移..."
npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma

if [ "$DEPLOY_MODE" == "docker" ]; then
    echo "[4/5] 重新构建Docker..."
    docker-compose down
    docker-compose up -d --build
else
    echo "[4/5] 重新构建项目..."
    npm run build
    
    echo "[5/5] 重启服务..."
    pm2 restart qidian-cms-backend
fi

echo "========================================"
echo "更新完成!"
echo "========================================"
