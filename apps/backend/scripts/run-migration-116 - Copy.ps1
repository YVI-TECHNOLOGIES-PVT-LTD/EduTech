$sqlFile = "c:\Users\DELL\OneDrive\Desktop\School_Management_System\backend\database\migrations\116_assessment_evaluation_engine.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Error "Migration file not found."
    exit 1
}

$sql = Get-Content -Raw -Path $sqlFile
# Remove single-line comments and clean up
$sql = $sql -replace '(?m)^--.*$', ''
$sql = $sql -trim

$queries = $sql -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" -and $_ -notlike "BEGIN" -and $_ -notlike "COMMIT" }

$url = "https://umvbyywkojuxnxgkuwbt.supabase.co/rest/v1/rpc/exec_transaction_queries"
$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtdmJ5eXdrb2p1eG54Z2t1d2J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDI5OTA2NCwiZXhwIjoyMDk1ODc1MDY0fQ.1Ioib7SrEx8RbhwtZzYFbnL1dQLOLvcqGpo-MlhWTkQ"

$headers = @{
    "apikey" = $apiKey
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

foreach ($q in $queries) {
    if ([string]::IsNullOrWhiteSpace($q)) { continue }
    Write-Host "Running: $q"
    $body = @{
        "sql_queries" = @($q)
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
        Write-Host "Success!"
    } catch {
        Write-Error "Failed: $_"
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errResp = $reader.ReadToEnd()
        Write-Host "Error Details: $errResp"
        exit 1
    }
}

Write-Host "✅ Migration 116 successfully applied via PowerShell RPC!"
