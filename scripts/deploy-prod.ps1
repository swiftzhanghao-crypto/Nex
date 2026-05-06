#requires -Version 5.1
<#
.SYNOPSIS
    一键部署到 Windows 服务器。本地构建前端 + 同步源文件 + 重启 NexSrv 计划任务。

.DESCRIPTION
    流程：
    1. 读取 .deploy.env 凭据与目标信息
    2. 计算自上次部署以来变化的源文件（基于 .deploy-last-commit），全量同步用 -FullSync
    3. 通过 pscp 上传变化文件（先到用户 home，再 plink 移到部署目录）
    4. 本地 npm run build 生成 dist
    5. 上传 dist.zip → 服务端解压替换
    6. 停止 NexSrv（schtasks /End + 强杀监听端口的 PID）
    7. schtasks /Run 启动 NexSrv
    8. 轮询 /api/health 验证

.PARAMETER BaseCommit
    手动指定差异比较起点（默认读取 .deploy-last-commit 或者全量）

.PARAMETER FullSync
    强制上传所有源文件（首次部署或不确定服务端状态时使用）

.PARAMETER SkipBuild
    跳过前端构建与 dist 上传（仅同步源文件后重启服务）

.PARAMETER SkipUpload
    跳过源文件上传（仅重新构建 dist 上传 + 重启服务）

.EXAMPLE
    .\scripts\deploy-prod.ps1                  # 增量部署（默认）
    .\scripts\deploy-prod.ps1 -FullSync        # 全量同步
    .\scripts\deploy-prod.ps1 -SkipBuild       # 仅同步源代码并重启（适用于纯 server 端改动）
#>
[CmdletBinding()]
param(
    [string]$BaseCommit,
    [switch]$FullSync,
    [switch]$SkipBuild,
    [switch]$SkipUpload
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $RepoRoot

# ------------------------------ 加载配置 ------------------------------
$envFile = Join-Path $RepoRoot '.deploy.env'
if (-not (Test-Path $envFile)) {
    throw @"
缺少 $envFile。请在仓库根目录创建（已 gitignore），格式如下：
DEPLOY_HOST=10.99.128.225
DEPLOY_USER=mac
DEPLOY_USER_PW=12345654321
DEPLOY_ADMIN=sshadmin
DEPLOY_ADMIN_PW=Ssh@Admin2026!
DEPLOY_DIR=C:\Users\mac\Desktop\nex
DEPLOY_HOSTKEY=SHA256:eds5eVJTexFv8ozfXcxeIcBOd8L4/yiV18AWKmtHLp4
DEPLOY_TASK=NexSrv
DEPLOY_PORT=4567
"@
}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$') {
        Set-Variable -Name $matches[1] -Value ($matches[2].Trim('"').Trim("'")) -Scope Script
    }
}
$required = 'DEPLOY_HOST','DEPLOY_USER','DEPLOY_USER_PW','DEPLOY_ADMIN','DEPLOY_ADMIN_PW','DEPLOY_DIR','DEPLOY_HOSTKEY','DEPLOY_TASK','DEPLOY_PORT'
foreach ($k in $required) {
    if (-not (Get-Variable -Name $k -Scope Script -ErrorAction SilentlyContinue)) {
        throw "缺少配置项 $k（请检查 .deploy.env）"
    }
}

# ------------------------------ 工具准备 ------------------------------
if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
    if (Test-Path 'C:\Program Files\PuTTY\plink.exe') { $env:PATH += ';C:\Program Files\PuTTY' }
    else { throw "未安装 PuTTY。请先执行：winget install --id PuTTY.PuTTY -e --accept-package-agreements --accept-source-agreements" }
}

function Invoke-Plink {
    # 通用 plink 调用，自带一次重试（应对偶发 server 响应超时）；
    # 函数内本地化 $ErrorActionPreference，避免 plink stderr 触发 NativeCommandError。
    param(
        [Parameter(Mandatory)][ValidateSet('user','admin')][string]$As,
        [Parameter(Mandatory)][string]$Cmd,
        [switch]$AllowFail
    )
    $pw = if ($As -eq 'admin') { $DEPLOY_ADMIN_PW } else { $DEPLOY_USER_PW }
    $u  = if ($As -eq 'admin') { $DEPLOY_ADMIN } else { $DEPLOY_USER }
    $oldEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $attempt = 0
        while ($true) {
            $attempt++
            $out = (& plink -ssh -batch -hostkey $DEPLOY_HOSTKEY -pw $pw "$u@$DEPLOY_HOST" $Cmd 2>&1) | Out-String
            $code = $LASTEXITCODE
            if ($code -eq 0) { return $out.TrimEnd() }
            if ($attempt -ge 2) { break }
            Start-Sleep -Seconds 4   # 简单退避
        }
        if ($AllowFail) { return $out.TrimEnd() }
        throw "plink($As) 失败（code=$code, attempts=$attempt）：$Cmd`n$out"
    } finally {
        $ErrorActionPreference = $oldEAP
    }
}
function Plink-User  { param([string]$Cmd, [switch]$AllowFail) Invoke-Plink -As user  -Cmd $Cmd -AllowFail:$AllowFail }
function Plink-Admin { param([string]$Cmd, [switch]$AllowFail) Invoke-Plink -As admin -Cmd $Cmd -AllowFail:$AllowFail }

function Pscp-Upload {
    # pscp 对 "C:/..." 路径解析不稳定 → 统一上传到 home，再用 plink 移动到目标位置
    param([Parameter(Mandatory)][string]$Local, [Parameter(Mandatory)][string]$RemoteHomeRel)
    $oldEAP = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $attempt = 0
        while ($true) {
            $attempt++
            & pscp -batch -hostkey $DEPLOY_HOSTKEY -pw $DEPLOY_USER_PW $Local "${DEPLOY_USER}@${DEPLOY_HOST}:$RemoteHomeRel" *>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) { return }
            if ($attempt -ge 2) { throw "pscp 上传失败：$Local" }
            Start-Sleep -Seconds 4
        }
    } finally {
        $ErrorActionPreference = $oldEAP
    }
}
function Run-RemoteBatch {
    # 把脚本内容存成 .bat 上传执行（避免多层引号转义）
    param([Parameter(Mandatory)][string]$Body, [switch]$AsAdmin)
    $name = '__dep_' + ([guid]::NewGuid().ToString('N').Substring(0, 8)) + '.bat'
    $localTmp = Join-Path $env:TEMP $name
    Set-Content -Path $localTmp -Value $Body -Encoding ASCII
    try {
        if ($AsAdmin) {
            & pscp -batch -hostkey $DEPLOY_HOSTKEY -pw $DEPLOY_ADMIN_PW $localTmp "${DEPLOY_ADMIN}@${DEPLOY_HOST}:$name" *>&1 | Out-Null
            $out = & plink -ssh -batch -hostkey $DEPLOY_HOSTKEY -pw $DEPLOY_ADMIN_PW "$DEPLOY_ADMIN@$DEPLOY_HOST" "%USERPROFILE%\$name & del /q %USERPROFILE%\$name" 2>&1
        } else {
            & pscp -batch -hostkey $DEPLOY_HOSTKEY -pw $DEPLOY_USER_PW $localTmp "${DEPLOY_USER}@${DEPLOY_HOST}:$name" *>&1 | Out-Null
            $out = & plink -ssh -batch -hostkey $DEPLOY_HOSTKEY -pw $DEPLOY_USER_PW "$DEPLOY_USER@$DEPLOY_HOST" "%USERPROFILE%\$name & del /q %USERPROFILE%\$name" 2>&1
        }
        if ($LASTEXITCODE -ne 0) { throw "远程批处理失败 -> $out" }
        return $out
    } finally {
        Remove-Item $localTmp -Force -ErrorAction SilentlyContinue
    }
}

# ------------------------------ 计算变更文件 ------------------------------
$lastFile = Join-Path $RepoRoot '.deploy-last-commit'
if (-not $BaseCommit -and -not $FullSync -and (Test-Path $lastFile)) {
    $BaseCommit = (Get-Content $lastFile -Raw).Trim()
}
$head = (& git rev-parse HEAD).Trim()

$srcExt = '\.(ts|tsx|js|jsx|json|html|css|md|sql|bat|ps1)$'
$srcExclude = '^(dist|node_modules|data|backend)/|^server\.log$|^\.env$|^\.deploy'

if ($SkipUpload) {
    $files = @()
    Write-Host "[deploy] -SkipUpload：跳过源文件同步" -ForegroundColor Yellow
} elseif ($FullSync -or -not $BaseCommit) {
    Write-Host "[deploy] 模式：全量同步（git ls-files）" -ForegroundColor Yellow
    $files = & git ls-files | Where-Object { $_ -match $srcExt -and $_ -notmatch $srcExclude }
} else {
    Write-Host "[deploy] 模式：增量（基线 $BaseCommit -> HEAD $head）" -ForegroundColor Cyan
    # 仅同步已提交的差异。本地未提交的脏文件不上传，避免 npm install 等副作用。
    $files = & git diff --name-only $BaseCommit HEAD | Where-Object { $_ -match $srcExt -and $_ -notmatch $srcExclude }
}

# ------------------------------ 上传变更源文件 ------------------------------
if ($files -and $files.Count -gt 0) {
    Write-Host "[deploy] 待上传 $($files.Count) 个文件" -ForegroundColor Cyan
    foreach ($f in $files) {
        if (-not (Test-Path $f)) { Write-Host "  [skip] $f (本地已删除)"; continue }
        $tmpName = '__src_' + ([guid]::NewGuid().ToString('N').Substring(0, 8)) + '_' + ([System.IO.Path]::GetFileName($f))
        Pscp-Upload -Local $f -RemoteHomeRel $tmpName
        $remoteWin = $f -replace '/','\'
        $parentDir = Split-Path -Parent $remoteWin
        if ($parentDir) {
            Plink-User "if not exist `"$DEPLOY_DIR\$parentDir`" mkdir `"$DEPLOY_DIR\$parentDir`"" -AllowFail | Out-Null
        }
        Plink-User "move /Y `"%USERPROFILE%\$tmpName`" `"$DEPLOY_DIR\$remoteWin`"" | Out-Null
        Write-Host "  [ok] $f"
    }
} else {
    Write-Host "[deploy] 无需同步源文件"
}

# ------------------------------ 本地构建前端 ------------------------------
if (-not $SkipBuild) {
    Write-Host "[deploy] 构建前端..." -ForegroundColor Cyan
    $buildOut = & npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ($buildOut | Out-String) -ForegroundColor Red
        throw "npm run build 失败"
    }
    Write-Host ($buildOut | Select-Object -Last 4 | Out-String).TrimEnd()

    $zipLocal = Join-Path $env:TEMP ('dist-upload-' + [guid]::NewGuid().ToString('N').Substring(0, 8) + '.zip')
    Compress-Archive -Path 'dist\*' -DestinationPath $zipLocal -CompressionLevel Optimal
    Write-Host "[deploy] dist.zip 大小：$([math]::Round((Get-Item $zipLocal).Length/1KB)) KB"
    Pscp-Upload -Local $zipLocal -RemoteHomeRel 'dist-upload.zip'
    Remove-Item $zipLocal -Force
}

# ------------------------------ 停服（强杀端口占用 PID） ------------------------------
Write-Host "[deploy] 停止 $DEPLOY_TASK..." -ForegroundColor Cyan
$pidLines = Plink-Admin "for /f `"tokens=5`" %a in ('netstat -ano ^| findstr :$DEPLOY_PORT ^| findstr LISTENING') do @echo %a" -AllowFail
Plink-Admin "schtasks /End /TN $DEPLOY_TASK >nul 2>&1 & timeout /t 2 /nobreak >nul" -AllowFail | Out-Null
if ($pidLines) {
    $listening = ($pidLines | Where-Object { "$_".Trim() -match '^\d+$' } | Select-Object -First 1)
    if ($listening) {
        $procPid = "$listening".Trim()
        Plink-Admin "taskkill /PID $procPid /T /F >nul 2>&1" -AllowFail | Out-Null
        Write-Host "  [ok] killed PID $procPid"
    }
}

# ------------------------------ 解压 dist ------------------------------
if (-not $SkipBuild) {
    Write-Host "[deploy] 解压 dist..." -ForegroundColor Cyan
    $extractBat = @"
@echo off
cd /d "$DEPLOY_DIR"
if exist dist.bak rmdir /s /q dist.bak
if exist dist ren dist dist.bak
move /Y "%USERPROFILE%\dist-upload.zip" dist-upload.zip >nul
powershell -NoProfile -Command "Expand-Archive -Path dist-upload.zip -DestinationPath dist -Force"
del /q dist-upload.zip
if exist dist.bak rmdir /s /q dist.bak
echo EXTRACTED
"@
    Run-RemoteBatch -Body $extractBat | Out-Null
}

# ------------------------------ 启服 ------------------------------
Write-Host "[deploy] 启动 $DEPLOY_TASK..." -ForegroundColor Cyan
Plink-Admin "schtasks /Run /TN $DEPLOY_TASK" | Out-Null

# ------------------------------ 健康检查 ------------------------------
Write-Host "[deploy] 健康检查 http://${DEPLOY_HOST}:$DEPLOY_PORT/api/health ..." -ForegroundColor Cyan
$ok = $false
Start-Sleep -Seconds 4
for ($i = 0; $i -lt 8; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://${DEPLOY_HOST}:$DEPLOY_PORT/api/health" -TimeoutSec 5 -UseBasicParsing
        if ($r.StatusCode -eq 200) { $ok = $true; Write-Host "[deploy] 健康检查通过：$($r.Content)" -ForegroundColor Green; break }
    } catch {
        Start-Sleep -Seconds 3
    }
}
if (-not $ok) { throw "服务未在预期时间内上线，请登录服务器查看 server.log" }

# ------------------------------ 记录已部署 commit ------------------------------
Set-Content -Path $lastFile -Value $head -Encoding ASCII
Write-Host "[deploy] 完成。已部署 commit：$head" -ForegroundColor Green
Write-Host "[deploy] 访问 http://${DEPLOY_HOST}:$DEPLOY_PORT" -ForegroundColor Green
