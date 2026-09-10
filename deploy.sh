#!/bin/bash
# =============================================================================
# KU CSC Automated Deployment Script
# สคริปต์อัปเดตระบบอัตโนมัติจาก GitHub สำหรับผู้พัฒนา
# =============================================================================
set -e

# กำหนดตัวแปรสภาพแวดล้อม Rootless Docker
USER_UID=$(id -u)
export PATH=/usr/bin:$PATH
export XDG_RUNTIME_DIR=/run/user/$USER_UID
export DOCKER_HOST=unix:///run/user/$USER_UID/docker.sock

PROJECT_DIR="$HOME/app"

echo "====================================================================="
echo "🚀 เริ่มต้นการ Deploy ระบบสำหรับ: $(whoami)"
echo "   เวลาปัจจุบัน: $(date '+%Y-%m-%d %H:%M:%S')"
echo "====================================================================="

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ ไม่พบโฟลเดอร์ $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# 1. ดึงโค้ดล่าสุดจาก Git (ถ้าเป็น Git Repo และ remote พร้อมใช้งาน)
if [ -d ".git" ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    echo "📥 [Git] ตรวจสอบโค้ดล่าสุดจาก branch: $BRANCH..."
    if git fetch origin "$BRANCH" 2>/dev/null; then
        git reset --hard "origin/$BRANCH"
        echo "✅ [Git] อัปเดตโค้ดเรียบร้อย (Commit: $(git rev-parse --short HEAD))"
    else
        echo "ℹ️ [Git] ใช้โค้ดปัจจุบันใน repository (Commit: $(git rev-parse --short HEAD 2>/dev/null))"
    fi
else
    echo "ℹ️ [Git] โฟลเดอร์นี้ยังไม่ได้เชื่อมโยง Git Repo (ข้ามขั้นตอน Git Pull)"
fi

# 2. ตรวจสอบไฟล์ .env
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "⚠️ ไม่พบไฟล์ .env กำลังคัดลอก .env.example มาเป็นไฟล์เริ่มต้น..."
    cp -n .env.example .env
fi

# 3. รัน Docker Compose
if [ -f "docker-compose.yml" ] || [ -f "compose.yaml" ] || [ -f "compose.yml" ]; then
    echo "🐳 [Docker] กำลังสั่ง Build และเริ่ม Container ใหม่..."
    docker compose up -d --build --remove-orphans
    echo "✅ [Docker] Containers อัปเดตและรันเรียบร้อย!"
else
    echo "⚠️ [Docker] ไม่พบไฟล์ docker-compose.yml ในโฟลเดอร์ $PROJECT_DIR"
fi

# 4. ทำความสะอาด Image เก่าที่ไม่ได้ใช้งาน (Dangling Images)
echo "🧹 [Docker] ทำความสะอาด Dangling Images..."
docker image prune -f >/dev/null 2>&1 || true

echo "====================================================================="
echo "🎉 DEPLOY สำเร็จสมบูรณ์แบบ!"
echo "====================================================================="
docker compose ps 2>/dev/null || docker ps
