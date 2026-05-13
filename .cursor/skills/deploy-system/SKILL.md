---
name: deploy-system
description: 将业务平台项目部署到远程 Windows 服务器的完整流程。当用户提到"部署系统"、"部署到服务器"、"发布到生产环境"、"更新服务器"、"部署到 Windows 机器"、"同步到远程"时使用此 Skill。即使用户只是简单说"部署"或"发布"，也应主动询问是否需要调用此 Skill。
---

# 部署系统

将业务平台项目构建并部署到远程 Windows 服务器，通过 SSH 自动完成环境检查、构建、上传、依赖安装和服务启动。

## 触发时机

当用户说"部署系统"时，先询问用户：

> 是否要调用【部署系统】Skill 将项目部署到远程服务器？

确认后再执行部署流程。

## 默认目标环境

| 配置项 | 默认值 |
|---|---|
| 目标机器 | `10.99.128.225` (Windows) |
| SSH 管理员 | `sshadmin` / `Ssh@Admin2026!` |
| 普通用户 | `mac` / `12345654321` |
| 部署目录 | `C:\Users\mac\Desktop\nex\` |
| 计划任务 | `NexSrv`（SYSTEM，开机自启） |
| 端口 | `4567` |

部署前应向用户确认这些参数是否有变化。

## SSH 连接方式

由于目标机器使用密码认证，通过 `expect` 脚本自动化 SSH 交互：

```bash
expect -c '
set timeout <TIMEOUT>
spawn ssh -o StrictHostKeyChecking=no sshadmin@<HOST>
expect "password:"
send "<PASSWORD>\r"
expect ">"
send "<COMMAND>\r"
expect ">"
send "exit\r"
expect eof
'
```

SCP 上传同理：

```bash
expect -c '
set timeout 60
spawn scp -o StrictHostKeyChecking=no <LOCAL_FILE> sshadmin@<HOST>:<REMOTE_PATH>
expect "password:"
send "<PASSWORD>\r"
expect eof
'
```

## 部署流程

### 第 1 步：连接远程机器，检查环境

SSH 连接后检查以下内容：

- Node.js 是否安装：`dir "C:\Program Files\nodejs\node.exe"`
- tsx 是否可用：`where tsx`
- 部署目录是否存在：`dir C:\Users\mac\Desktop\nex\`
- NexSrv 服务状态：`schtasks /query /tn "NexSrv"`
- 当前端口是否在监听：`netstat -ano | findstr :4567`

### 第 2 步：安装缺失的依赖（首次部署）

如果 Node.js 未安装：

```
# 下载 Node.js MSI
powershell -Command "Invoke-WebRequest -Uri https://nodejs.org/dist/v20.18.3/node-v20.18.3-x64.msi -OutFile C:\Users\sshadmin\node-install.msi"

# 静默安装（需等待 30-60 秒）
msiexec /i C:\Users\sshadmin\node-install.msi /qn /norestart ADDLOCAL=ALL
```

如果 tsx 未全局安装：

```
set PATH=C:\Program Files\nodejs;%PATH%
mkdir C:\Users\sshadmin\AppData\Roaming\npm 2>nul
npm install -g tsx
```

### 第 3 步：本地构建

在本地项目根目录执行：

```bash
npm run build
```

确保 `services/api.ts` 中 API_BASE 为 `/api`（相对路径），以支持同端口部署。

### 第 4 步：打包部署文件

将以下目录/文件打包为 tar.gz：

```bash
tar -czf /tmp/nex-deploy.tar.gz \
  dist/ server/ data/ types.ts \
  package.json package-lock.json tsconfig.json \
  vite.config.ts index.html App.tsx index.tsx \
  vite-env.d.ts services/ contexts/ components/
```

不包含 `node_modules/`（远程机器上单独安装）。

### 第 5 步：上传到远程机器

通过 SCP 上传打包文件：

```bash
scp /tmp/nex-deploy.tar.gz sshadmin@<HOST>:C:/Users/sshadmin/nex-deploy.tar.gz
```

### 第 6 步：远程解压和安装依赖

```cmd
:: 停止正在运行的服务
taskkill /f /im node.exe 2>nul

:: 创建目录并解压
mkdir C:\Users\mac\Desktop\nex 2>nul
cd C:\Users\mac\Desktop\nex
tar -xzf C:\Users\sshadmin\nex-deploy.tar.gz

:: 安装生产依赖（跳过原生编译）
set PATH=C:\Program Files\nodejs;%PATH%
npm install --omit=dev --ignore-scripts

:: 单独重建原生模块（better-sqlite3 有预编译二进制）
npm rebuild better-sqlite3
```

关键点：
- `--ignore-scripts` 跳过 `better-sqlite3` 的 node-gyp 编译（避免需要 Python/C++ 工具链）
- `npm rebuild better-sqlite3` 会使用包内自带的 Windows 预编译二进制

### 第 7 步：启动服务

服务通过 `server/production.ts` 运行，它在同一端口同时提供：
- Express API（`/api/*`）
- 前端静态文件（`dist/`）

启动脚本 `start.bat`：

```bat
@echo off
set PATH=C:\Program Files\nodejs;C:\Users\sshadmin\AppData\Roaming\npm;%PATH%
cd /d C:\Users\mac\Desktop\nex
tsx server/production.ts >> server.log 2>&1
```

### 第 8 步：创建/更新计划任务

```cmd
:: 创建开机自启计划任务
schtasks /create /tn "NexSrv" /tr "C:\Users\mac\Desktop\nex\start.bat" /sc onstart /ru SYSTEM /rl HIGHEST /f

:: 立即运行
schtasks /run /tn "NexSrv"
```

### 第 9 步：验证部署

等待 5 秒后验证：

1. 检查端口：`netstat -ano | findstr :4567`
2. 检查日志：`type C:\Users\mac\Desktop\nex\server.log`
3. 从本地测试 API：`curl http://<HOST>:4567/api/health`
4. 测试前端页面：`curl http://<HOST>:4567/ | head -5`

预期结果：
- API 返回 `{"status":"ok","time":"..."}`
- 前端返回 HTML 页面（`<!DOCTYPE html>`）

## 更新部署（非首次）

对于已部署过的环境，流程简化为：

1. 本地 `npm run build`
2. 打包 → SCP 上传
3. 远程：停服 → 解压覆盖 → 重启计划任务
4. 验证

无需重新安装 Node.js 或 npm 依赖（除非 `package.json` 有变化）。
如果 `package.json` 有变化，则需要重新执行 `npm install --omit=dev --ignore-scripts && npm rebuild better-sqlite3`。

## 同步 Git 仓库

部署完成后，提交变更并推送到所有远程仓库：

```bash
git add -A && git commit -m "deploy: ..."

# GitHub（需绕过代理）
env http_proxy="" https_proxy="" no_proxy="*" git -c http.proxy="" -c https.proxy="" push origin main
env http_proxy="" https_proxy="" no_proxy="*" git -c http.proxy="" -c https.proxy="" push nex main

# GitLab（直连）
git push ksogit main
```

## 故障排查

| 问题 | 解决方案 |
|---|---|
| `better-sqlite3` 编译失败 | 使用 `--ignore-scripts` + `npm rebuild` 方式 |
| SSH 代理连接超时 | 使用 `expect` + 密码认证 |
| Express `'*'` 路由报错 | Express v5 用 `app.use()` 替代 `app.get('*')` |
| GitHub push 被代理阻断 | 临时清除 `http.proxy` 配置 |
| Node.js MSI 安装缓慢 | 安装后等待 30-60 秒再验证 |
| `npx` 报 ENOENT | 先创建 `npm` 目录：`mkdir %APPDATA%\npm` |
