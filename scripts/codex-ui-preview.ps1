param(
    [switch]$Background
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$Port = 1420
$HostName = "localhost"
$Url = "http://${HostName}:${Port}"
$LogDir = Join-Path $RepoRoot ".agents\logs"
$OutLog = Join-Path $LogDir "codex-ui-preview.out.log"
$ErrLog = Join-Path $LogDir "codex-ui-preview.err.log"

function Test-LocalPort {
    param([int]$PortToTest)

    $Listener = Get-NetTCPConnection -LocalPort $PortToTest -State Listen -ErrorAction SilentlyContinue
    return $null -ne $Listener
}

Set-Location $RepoRoot

if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot "node_modules"))) {
    Write-Host "Installing npm dependencies..."
    npm install
}

if (Test-LocalPort -PortToTest $Port) {
    Write-Host "KKTerm UI preview is already running at $Url"
    exit 0
}

if ($Background) {
    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

    $Arguments = @(
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        "Set-Location -LiteralPath '$RepoRoot'; npm run dev"
    )

    Start-Process `
        -FilePath "powershell" `
        -ArgumentList $Arguments `
        -WindowStyle Hidden `
        -RedirectStandardOutput $OutLog `
        -RedirectStandardError $ErrLog

    for ($Attempt = 0; $Attempt -lt 40; $Attempt++) {
        if (Test-LocalPort -PortToTest $Port) {
            Write-Host "KKTerm UI preview is running at $Url"
            Write-Host "Logs: $OutLog"
            exit 0
        }

        Start-Sleep -Milliseconds 250
    }

    Write-Error "Timed out waiting for KKTerm UI preview at $Url. Check $ErrLog"
}

Write-Host "Starting KKTerm UI preview at $Url"
npm run dev
