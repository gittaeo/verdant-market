$ErrorActionPreference = 'Stop'
$nodePath = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
$scriptPath = Join-Path $PSScriptRoot 'scripts/local-dashboard.mjs'
$siteUrl = 'http://127.0.0.1:5177'
$ready = $false
try { $status = Invoke-RestMethod "$siteUrl/api/status" -TimeoutSec 2; $ready = $status.execution -eq 'local' } catch {}
if (-not $ready) {
    if (-not (Test-Path -LiteralPath $nodePath)) { throw 'Node 실행 경로를 찾을 수 없습니다. Codex에서 실행 환경을 확인해 주세요.' }
    Start-Process -FilePath $nodePath -ArgumentList @('"' + $scriptPath + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 300
        try { $status = Invoke-RestMethod "$siteUrl/api/status" -TimeoutSec 1; if ($status.execution -eq 'local') { $ready = $true; break } } catch {}
    }
}
if (-not $ready) { throw 'VERDANT 실행에 실패했습니다. 5177 포트를 확인해 주세요.' }
Start-Process $siteUrl
