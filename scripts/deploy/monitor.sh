#!/bin/bash
# 监控脚本

PROJECT_DIR="/www/wwwroot/qidian-cms"
LOG_FILE="/var/log/qidian-cms-monitor.log"

check_service() {
    local name=$1
    local status
    
    if [ "$2" == "docker" ]; then
        status=$(docker-compose -f "$PROJECT_DIR/docker-compose.yml" ps | grep "$name" | grep -c "Up" || echo "0")
    else
        status=$(pm2 list | grep "$name" | grep -c "online" || echo "0")
    fi
    
    if [ "$status" -eq 0 ]; then
        echo "$(date): $name 服务异常，尝试重启..." >> "$LOG_FILE"
        
        if [ "$2" == "docker" ]; then
            docker-compose -f "$PROJECT_DIR/docker-compose.yml" restart "$name"
        else
            pm2 restart "$name"
        fi
    fi
}

# 检查后端服务
check_service "qidian-cms-backend" "${1:-docker}"

# 检查磁盘空间
disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$disk_usage" -gt 90 ]; then
    echo "$(date): 磁盘空间不足: ${disk_usage}%" >> "$LOG_FILE"
fi

# 检查内存
mem_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ "$mem_usage" -gt 90 ]; then
    echo "$(date): 内存使用率过高: ${mem_usage}%" >> "$LOG_FILE"
fi
