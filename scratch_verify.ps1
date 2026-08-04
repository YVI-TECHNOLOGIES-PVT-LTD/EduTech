$ErrorActionPreference = "Continue"

Write-Host "=== EduTrack Enterprise Workspace Verification Suite ===" -ForegroundColor Cyan

$results = @()
$reportData = @{
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    workspaces = @{}
}

function Invoke-Step {
    param(
        [string]$Workspace,
        [string]$Name,
        [string]$Command
    )
    Write-Host "`n---> Running: $Name ($Command)..." -ForegroundColor Yellow
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    
    Invoke-Expression $Command
    $exitCode = $LASTEXITCODE
    $sw.Stop()
    $durationVal = [math]::Round($sw.Elapsed.TotalSeconds, 2)
    $durationStr = "${durationVal}s"

    if ($exitCode -eq 0) {
        $status = "PASS"
        Write-Host "     Result: PASS | Exit Code: 0 | Duration: $durationStr" -ForegroundColor Green
    } else {
        $status = "FAIL"
        Write-Host "     Result: FAIL | Exit Code: $exitCode | Duration: $durationStr" -ForegroundColor Red
    }

    return [PSCustomObject]@{
        Workspace = $Workspace
        Step = $Name
        Command = $Command
        Status = $status
        ExitCode = $exitCode
        Duration = $durationStr
    }
}

$steps = @(
    @{ Workspace = "api"; Name = "Backend TypeCheck"; Command = "npx tsc --noEmit --project apps/api/tsconfig.json" },
    @{ Workspace = "web"; Name = "Frontend TypeCheck"; Command = "npx tsc --noEmit --project apps/web/tsconfig.json" },
    @{ Workspace = "mobile"; Name = "Mobile TypeCheck"; Command = "npx tsc --noEmit --project apps/mobile/tsconfig.json" },
    @{ Workspace = "api"; Name = "Backend Build"; Command = "npm --prefix apps/api run build" },
    @{ Workspace = "web"; Name = "Frontend Build"; Command = "npm --prefix apps/web run build" }
)

foreach ($s in $steps) {
    $res = Invoke-Step -Workspace $s.Workspace -Name $s.Name -Command $s.Command
    $results += $res
    
    if (-not $reportData.workspaces.ContainsKey($s.Workspace)) {
        $reportData.workspaces[$s.Workspace] = @{}
    }
    $reportData.workspaces[$s.Workspace][$s.Name] = @{
        status = $res.Status
        exitCode = $res.ExitCode
        duration = $res.Duration
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$jsonOutput = $reportData | ConvertTo-Json -Depth 5
$jsonOutput | Out-File -FilePath "verification-report.json" -Encoding utf8
Write-Host "`n[Report Exported] Saved machine-readable artifact to verification-report.json" -ForegroundColor Green
