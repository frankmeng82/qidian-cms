#!/bin/bash
# 一键安装脚本

echo "=========================================="
echo "奇点影视CMS - 一键安装"
echo "=========================================="
echo ""

# 交互式配置
echo "请选择部署方式:"
echo "1) Docker部署 (推荐)"
echo "2) 手动部署"
read -p "请输入选项 (1/2): " deploy_choice

case $deploy_choice in
    1)
        DEPLOY_MODE="docker"
        ;;
    2)
        DEPLOY_MODE="manual"
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

read -p "请输入域名 (如: cms.yourdomain.com): " DOMAIN
read -p "请输入数据库密码 (留空自动生成): " DB_PASS
read -p "请输入JWT密钥 (留空自动生成): " JWT_SECRET

# 设置环境变量
export DOMAIN
export DB_PASS
export JWT_SECRET
export DEPLOY_MODE

echo ""
echo "开始安装..."
echo ""

# 执行部署脚本
./bt-deploy.sh "$DEPLOY_MODE"

echo ""
echo "安装完成!"
echo "访问地址: http://$DOMAIN"
