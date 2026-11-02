$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$outputDirectory = Join-Path $projectRoot 'source-archives'
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("siyuan-copilot-source-" + [guid]::NewGuid().ToString('N'))
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$zipPath = Join-Path $outputDirectory "siyuan-plugin-copilot-source-$timestamp.zip"

# Omit VCS metadata, dependencies, generated build output, caches, and archives from prior runs.
$excludedDirectories = @(
    '.git', 'node_modules', 'dist', 'build', 'coverage', 'out', 'target', 'dev', 'tmp',
    '.next', '.vite', '.cache', '.turbo', '.svelte-kit', '.output', 'source-archives'
)
$excludedFiles = @('package.zip', '*.log', '*.tsbuildinfo', 'vite.config.ts.timestamp-*.mjs', '.env')

try {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
    New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null

    $files = Get-ChildItem -LiteralPath $projectRoot -Recurse -File -Force
    $copied = 0
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($projectRoot.Length).TrimStart([char[]]@('\', '/'))
        $parts = $relative -split '[\\/]'
        if ($parts | Where-Object { $excludedDirectories -contains $_ }) { continue }
        if ($excludedFiles | Where-Object { $file.Name -like $_ }) { continue }

        $target = Join-Path $tempRoot $relative
        $parent = Split-Path -Parent $target
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
        Copy-Item -LiteralPath $file.FullName -Destination $target -Force
        $copied++
    }

    if ($copied -eq 0) { throw 'No source files were selected.' }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
    [System.IO.Compression.ZipFile]::CreateFromDirectory(
        $tempRoot,
        $zipPath,
        [System.IO.Compression.CompressionLevel]::Optimal,
        $false
    )
    Write-Host ''
    Write-Host "Source archive created: $zipPath" -ForegroundColor Green
    Write-Host "Included files: $copied"
} finally {
    if (Test-Path -LiteralPath $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
}
