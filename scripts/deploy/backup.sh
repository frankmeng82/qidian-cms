#!/bin/bash
# 备份脚本

set -e

PROJECT_DIR="/www/wwwroot/qidian-cms"
BACKUP_DIR="/www/backup/qidian-cms"
DB_NAME="qidian_cms"
DB_USER="qidian_user"
DATE=$(date +%Y%m%d_%H%M%S)

echo "========================================"
echo "奇点影视CMS - 数据备份"
echo "========================================"

mkdir -p "$BACKUP_DIR"

echo "[1/3] 备份数据库..."
sudo -u postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/db_${DATE}.sql"

echo "[2/3] 备份上传文件..."
if [ -d "$PROJECT_DIR/apps/backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_${DATE}.tar.gz" -C "$PROJECT_DIR/apps/backend" uploads
fi

echo "[3/3] 备份配置文件..."
cp "$PROJECT_DIR/apps/backend/.env" "$BACKUP_DIR/env_${DATE}.backup"

echo "========================================"
echo "备份完成: $BACKUP_DIR"
echo "========================================"
ls -lh "$BACKUP_DIR"
