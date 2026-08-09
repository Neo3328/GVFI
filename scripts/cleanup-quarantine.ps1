# GVFI Cleanup Quarantine Script
# Run from project root: powershell -ExecutionPolicy Bypass -File scripts\cleanup-quarantine.ps1
# Review each line before running. Set $WhatIf=$true to dry-run.

param(
    [switch]$WhatIf = $false,
    [switch]$IncludeScripts = $false,   # Include web-ui/scripts/*.mjs candidates
    [switch]$IncludeLogs = $true        # Include log/cache files
)

$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$q = Join-Path $root '.cleanup-quarantine'
New-Item -ItemType Directory -Path $q -Force | Out-Null

# Candidate list from docs/file-cleanup-audit.md
$candidates = @(
    # Public SVG leftovers (safe to remove after verification)
    @{ Path = 'web-ui\public\next.svg';      Reason = 'unused create-next-app leftover'; Risk = 'Low' }
    @{ Path = 'web-ui\public\vercel.svg';    Reason = 'unused create-next-app leftover'; Risk = 'Low' }
    @{ Path = 'web-ui\public\globe.svg';     Reason = 'unused create-next-app leftover'; Risk = 'Low' }
    @{ Path = 'web-ui\public\file.svg';      Reason = 'unused create-next-app leftover'; Risk = 'Low' }
    @{ Path = 'web-ui\public\window.svg';    Reason = 'unused create-next-app leftover'; Risk = 'Low' }

    # Local logs and caches
    @{ Path = 'web-ui\_next-err.txt';        Reason = 'local error log'; Risk = 'Low'; Include = $IncludeLogs }
    @{ Path = 'web-ui\_test-err.txt';        Reason = 'local error log'; Risk = 'Low'; Include = $IncludeLogs }
    @{ Path = 'web-ui\_server-err.txt';      Reason = 'local error log'; Risk = 'Low'; Include = $IncludeLogs }
    @{ Path = 'web-ui\dist-build.log';       Reason = 'build log'; Risk = 'Low'; Include = $IncludeLogs }
    @{ Path = 'web-ui\tsconfig.tsbuildinfo'; Reason = 'incremental build cache'; Risk = 'Low'; Include = $IncludeLogs }

    # Documentation stub
    @{ Path = 'web-ui\CLAUDE.md';            Reason = 'stub duplicating AGENTS.md'; Risk = 'Low' }

    # Optional: unreferenced acceptance scripts (set -IncludeScripts to enable)
    @{ Path = 'web-ui\scripts\browser-acceptance.mjs'; Reason = 'unreferenced debug harness'; Risk = 'Medium'; Include = $IncludeScripts }
    @{ Path = 'web-ui\scripts\e2e-acceptance.mjs';     Reason = 'unreferenced debug harness'; Risk = 'Medium'; Include = $IncludeScripts }
    @{ Path = 'web-ui\scripts\debug-hydrate.mjs';      Reason = 'unreferenced debug harness'; Risk = 'Medium'; Include = $IncludeScripts }
)

$manifest = @()
$moved = 0
$skipped = 0

foreach ($item in $candidates) {
    $src = Join-Path $root $item.Path
    if (-not (Test-Path $src)) {
        Write-Host "[SKIP] $($item.Path) - not found" -ForegroundColor Yellow
        $skipped++
        continue
    }

    if ($item.ContainsKey('Include') -and -not $item.Include) {
        Write-Host "[SKIP] $($item.Path) - use -IncludeScripts or -IncludeLogs to enable" -ForegroundColor Cyan
        $skipped++
        continue
    }

    $dst = Join-Path $q $item.Path
    $dstDir = Split-Path $dst -Parent

    if ($WhatIf) {
        Write-Host "[WHATIF] Would move: $($item.Path) -> $dst" -ForegroundColor Green
        continue
    }

    New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
    Move-Item -LiteralPath $src -Destination $dst -Force
    Write-Host "[MOVED] $($item.Path)" -ForegroundColor Green

    $manifest += [PSCustomObject]@{
        originalPath = $item.Path
        quarantinePath = $dst.Substring($root.Length + 1)
        movedAt = (Get-Date).ToString('o')
        reason = $item.Reason
        risk = $item.Risk
    }
    $moved++
}

# Write manifest
$manifestPath = Join-Path $q 'MANIFEST.json'
$manifest | ConvertTo-Json -Depth 3 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "  Moved: $moved"
Write-Host "  Skipped: $skipped"
Write-Host "  Manifest: $manifestPath"
Write-Host "`nTo restore: Move-Item .cleanup-quarantine\<path> <original>" -ForegroundColor Yellow

if ($moved -gt 0) {
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. npm test"
    Write-Host "  2. npm run build"
    Write-Host "  3. Start app and verify UI"
}
