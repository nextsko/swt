# Android SDK One-Click Install Script
# Must be run as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Android SDK One-Click Install" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Please run this script as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell -> Run as Administrator" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Administrator privilege check passed" -ForegroundColor Green
Write-Host ""

# Step 1: Install Chocolatey
Write-Host "Step 1/6: Installing Chocolatey..." -ForegroundColor Yellow
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Host "[OK] Chocolatey installed" -ForegroundColor Green
} else {
    Write-Host "[OK] Chocolatey already installed" -ForegroundColor Green
}
Write-Host ""

# Step 2: Install Android SDK
Write-Host "Step 2/6: Installing Android SDK..." -ForegroundColor Yellow
if (-not (Test-Path "$env:LOCALAPPDATA\Android\Sdk")) {
    choco install android-sdk -y
    Write-Host "[OK] Android SDK installed" -ForegroundColor Green
} else {
    Write-Host "[OK] Android SDK already installed" -ForegroundColor Green
}
Write-Host ""

# Step 3: Install Android NDK
Write-Host "Step 3/6: Installing Android NDK..." -ForegroundColor Yellow
if (-not (Test-Path "$env:LOCALAPPDATA\Android\Sdk\ndk")) {
    choco install android-ndk -y
    Write-Host "[OK] Android NDK installed" -ForegroundColor Green
} else {
    Write-Host "[OK] Android NDK already installed" -ForegroundColor Green
}
Write-Host ""

# Step 4: Set environment variables
Write-Host "Step 4/6: Setting environment variables..." -ForegroundColor Yellow
$androidSdkPath = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_HOME = $androidSdkPath
$env:ANDROID_SDK_ROOT = $androidSdkPath

# Set permanent environment variables
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $androidSdkPath, 'User')
[System.Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $androidSdkPath, 'User')

# Update PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$pathsToAdd = @(
    "$androidSdkPath\platform-tools",
    "$androidSdkPath\cmdline-tools\latest\bin",
    "$androidSdkPath\emulator"
)

foreach ($path in $pathsToAdd) {
    if ($currentPath -notlike "*$path*") {
        [System.Environment]::SetEnvironmentVariable('Path', "$currentPath;$path", 'User')
        $currentPath = "$currentPath;$path"
    }
}

Write-Host "[OK] Environment variables set" -ForegroundColor Green
Write-Host "  ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Gray
Write-Host ""

# Step 5: Accept licenses
Write-Host "Step 5/6: Accepting Android SDK licenses..." -ForegroundColor Yellow
& "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat" --licenses
Write-Host "[OK] Licenses accepted" -ForegroundColor Green
Write-Host ""

# Step 6: Install required SDK components
Write-Host "Step 6/6: Installing SDK components..." -ForegroundColor Yellow
$sdkmanager = "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat"

$components = @(
    "platform-tools",
    "platforms;android-34",
    "build-tools;34.0.0",
    "ndk;26.1.10909125"
)

foreach ($component in $components) {
    Write-Host "  Installing $component..." -ForegroundColor Gray
    & $sdkmanager $component
}

Write-Host "[OK] SDK components installed" -ForegroundColor Green
Write-Host ""

# Done
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please close and reopen PowerShell for environment variables to take effect" -ForegroundColor Yellow
Write-Host "Then run to verify: task android:install:deps" -ForegroundColor Yellow
Write-Host ""
