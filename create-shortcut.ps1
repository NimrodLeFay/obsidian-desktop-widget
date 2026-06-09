# Run this once to create a proper desktop shortcut.
# The shortcut launches the widget WITHOUT a CMD window staying open.
# Usage: right-click → Run with PowerShell

$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$electronExe = Join-Path $scriptDir "node_modules\electron\dist\electron.exe"
$iconPath    = $electronExe  # uses electron icon; replace with your own .ico if desired

if (-Not (Test-Path $electronExe)) {
    Write-Host "ERROR: electron.exe not found at:" -ForegroundColor Red
    Write-Host "  $electronExe" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run 'npm install' first inside the widget folder." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Create desktop shortcut
$desktop    = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "Obsidian Graph Widget.lnk"

$wsh = New-Object -ComObject WScript.Shell
$sc  = $wsh.CreateShortcut($shortcutPath)
$sc.TargetPath       = $electronExe
$sc.Arguments        = "`"$scriptDir`""
$sc.WorkingDirectory = $scriptDir
$sc.WindowStyle      = 1   # Normal (not hidden — Electron manages its own window)
$sc.Description      = "Obsidian Graph Widget"
$sc.IconLocation     = $electronExe
$sc.Save()

Write-Host "Shortcut created on Desktop: 'Obsidian Graph Widget'" -ForegroundColor Green
Write-Host ""
Write-Host "You can also add it to Startup:" -ForegroundColor Cyan
Write-Host "  Copy the shortcut to:" -ForegroundColor Cyan
$startup = [Environment]::GetFolderPath("Startup")
Write-Host "  $startup" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
