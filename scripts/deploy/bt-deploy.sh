#!/bin/bash
# 宝塔面板自动化部署脚本 - 奇点影视CMS
# 使用方法: ./bt-deploy.sh [docker|manual]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="qidian-cms"
PROJECT_DIR="/www/wwwroot/${PROJECT_NAME}"
DOMAIN="${DOMAIN:-your-domain.com}"
DB_NAME="${DB_NAME:-qidian_cms}"
DB_USER="${DB_USER:-qidian_user}"
DB_PASS="${DB_PASS:-$(openssl rand -base64 12)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32)}"
DEPLOY_MODE="${1:-docker}"

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查宝塔环境
check_bt_env() {
    log_info "检查宝塔环境..."
    
    if [ ! -f "/etc/init.d/bt" ]; then
        log_error "未检测到宝塔面板，请先安装宝塔"
        exit 1
    fi
    
    log_info "宝塔面板已安装"
}

# 安装依赖软件
install_dependencies() {
    log_info "安装依赖软件..."
    
    if [ "$DEPLOY_MODE" == "docker" ]; then
        # Docker模式
        if ! command -v docker &> /dev/null; then
            log_info "安装Docker..."
            curl -fsSL https://get.docker.com | bash
            systemctl start docker
            systemctl enable docker
        fi
        
        if ! command -v docker-compose &> /dev/null; then
            log_info "安装Docker Compose..."
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
    else
        # 手动模式
        log_info "安装Node.js 20..."
        if [ ! -f "/www/server/nvm/nvm.sh" ]; then
            log_warn "请先在宝塔面板安装Node.js版本管理器"
            exit 1
        fi
        
        source /www/server/nvm/nvm.sh
        nvm install 20
        nvm use 20
        nvm alias default 20
        
        log_info "安装PM2..."
        npm install -g pm2
    fi
    
    log_info "依赖软件安装完成"
}

# 准备项目目录
prepare_project() {
    log_info "准备项目目录..."
    
    if [ -d "$PROJECT_DIR" ]; then
        log_warn "项目目录已存在，备份旧项目..."
        mv "$PROJECT_DIR" "${PROJECT_DIR}.backup.$(date +%Y%m%d%H%M%S)"
    fi
    
    mkdir -p "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    log_info "项目目录准备完成: $PROJECT_DIR"
}

# 下载项目代码
download_project() {
    log_info "下载项目代码..."
    
    # 如果有Git仓库
    if [ -n "$GIT_REPO" ]; then
        git clone "$GIT_REPO" .
    else
        log_warn "请手动上传项目代码到 $PROJECT_DIR"
        log_info "上传完成后按回车继续..."
        read
    fi
    
    log_info "项目代码准备完成"
}

# Docker部署
deploy_docker() {
    log_info "开始Docker部署..."
    
    cd "$PROJECT_DIR"
    
    # 修改docker-compose.yml端口（避免冲突）
    log_info "配置Docker Compose..."
    sed -i 's/8080:80/8888:80/g' docker-compose.yml
    
    # 启动服务
    log_info "构建并启动服务..."
    docker-compose up -d --build
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log_info "Docker服务启动成功"
    else
        log_error "Docker服务启动失败，请检查日志"
        docker-compose logs
        exit 1
    fi
    
    # 配置宝塔站点
    setup_bt_site_docker
}

# 手动部署
deploy_manual() {
    log_info "开始手动部署..."
    
    cd "$PROJECT_DIR"
    
    # 创建数据库
    create_database
    
    # 安装依赖
    log_info "安装项目依赖..."
    npm install
    
    # 生成Prisma客户端
    log_info "生成Prisma客户端..."
    npm run prisma:generate --workspace @qidian-cms/backend
    
    # 执行数据库迁移
    log_info "执行数据库迁移..."
    npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
    
    # 配置环境变量
    setup_env
    
    # 构建项目
    log_info "构建项目..."
    npm run build
    
    # 启动服务
    start_services
    
    # 配置宝塔站点
    setup_bt_site_manual
}

# 创建数据库
create_database() {
    log_info "创建数据库..."
    
    # 检查PostgreSQL
    if ! command -v psql &> /dev/null; then
        log_warn "请先在宝塔面板安装PostgreSQL"
        exit 1
    fi
    
    # 创建数据库和用户
    sudo -u postgres psql << EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
EOF
    
    log_info "数据库创建完成"
    log_info "数据库名: $DB_NAME"
    log_info "用户名: $DB_USER"
    log_info "密码: $DB_PASS"
}

# 配置环境变量
setup_env() {
    log_info "配置环境变量..."
    
    cat > apps/backend/.env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
EOF
    
    log_info "环境变量配置完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 使用PM2启动后端
    pm2 start apps/backend/dist/server.js --name "${PROJECT_NAME}-backend"
    pm2 save
    pm2 startup
    
    log_info "服务启动完成"
}

# 配置宝塔站点 - Docker模式
setup_bt_site_docker() {
    log_info "配置宝塔站点..."
    
    # 创建站点
    bt default site add --domain "$DOMAIN" --type reverse_proxy --proxy_url "http://127.0.0.1:8888"
    
    log_info "宝塔站点配置完成"
}

# 配置宝塔站点 - 手动模式
setup_bt_site_manual() {
    log_info "配置宝塔站点..."
    
    # 创建站点
    bt default site add --domain "$DOMAIN" --path "$PROJECT_DIR/apps/frontend/dist"
    
    # 配置Nginx反向代理
    local nginx_conf="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
    
    cat > "$nginx_conf" << 'EOF'
server {
    listen 80;
    server_name DOMAIN;
    
    location / {
        root /www/wwwroot/qidian-cms/apps/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    
    sed -i "s/DOMAIN/$DOMAIN/g" "$nginx_conf"
    
    # 重启Nginx
    /etc/init.d/nginx reload
    
    log_info "宝塔站点配置完成"
}

# 配置SSL
setup_ssl() {
    log_info "配置SSL证书..."
    
    read -p "是否配置SSL证书? (y/n): " setup_ssl
    if [ "$setup_ssl" == "y" ]; then
        bt default site ssl --domain "$DOMAIN" --letsencrypt
        log_info "SSL证书配置完成"
    fi
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "========================================"
    echo -e "${GREEN}部署完成!${NC}"
    echo "========================================"
    echo ""
    echo "项目信息:"
    echo "  项目名称: $PROJECT_NAME"
    echo "  项目目录: $PROJECT_DIR"
    echo "  访问域名: http://$DOMAIN"
    echo ""
    echo "数据库信息:"
    echo "  数据库名: $DB_NAME"
    echo "  用户名: $DB_USER"
    echo "  密码: $DB_PASS"
    echo ""
    echo "JWT密钥: $JWT_SECRET"
    echo ""
    echo "管理命令:"
    if [ "$DEPLOY_MODE" == "docker" ]; then
        echo "  查看日志: cd $PROJECT_DIR && docker-compose logs -f"
        echo "  重启服务: cd $PROJECT_DIR && docker-compose restart"
        echo "  停止服务: cd $PROJECT_DIR && docker-compose down"
    else
        echo "  查看日志: pm2 logs ${PROJECT_NAME}-backend"
        echo "  重启服务: pm2 restart ${PROJECT_NAME}-backend"
        echo "  停止服务: pm2 stop ${PROJECT_NAME}-backend"
    fi
    echo ""
    echo "========================================"
}

# 主函数
main() {
    echo "========================================"
    echo "奇点影视CMS - 宝塔自动化部署脚本"
    echo "========================================"
    echo ""
    
    # 检查参数
    if [ "$DEPLOY_MODE" != "docker" ] && [ "$DEPLOY_MODE" != "manual" ]; then
        echo "使用方法:"
        echo "  ./bt-deploy.sh docker   # Docker部署"
