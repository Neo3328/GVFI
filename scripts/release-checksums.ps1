# GVFI — Generate SHA-256 checksums for Windows release artifacts
# Developed by Mr. Gong
# Copyright © 2026 Mr. Gong. All Rights Reserved.

param(
  [Parameter(Mandatory = $false)]
  [string]$Version = "1.0.0",

  [Parameter(Mandatory = $false)]
  [string]$DistDir = ""
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
if (-not $DistDir) {
  $DistDir = Join-Path $root "web-ui\dist-gvfi"
}

$names = @(
  "GVFI-Setup-$Version.exe",
  "GVFI-Portable-$Version.exe"
)

Write-Host "[GVFI] Looking for artifacts in: $DistDir"
Write-Host "[GVFI] Version: $Version"
Write-Host ""

$found = 0
foreach ($name in $names) {
  $path = Join-Path $DistDir $name
  if (-not (Test-Path -LiteralPath $path)) {
    Write-Host "MISSING  $name"
    continue
  }
  $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
  $size = (Get-Item -LiteralPath $path).Length
  Write-Host "FILE     $name"
  Write-Host "SIZE     $size bytes"
  Write-Host "SHA256   $hash"
  Write-Host ""
  $found++
}

if ($found -eq 0) {
  Write-Host "No release artifacts found. Build first:"
  Write-Host "  cd web-ui && npm run dist:win:release"
  exit 1
}

Write-Host "Paste SHA256 lines into releases\$Version\DOWNLOADS.md"
exit 0
