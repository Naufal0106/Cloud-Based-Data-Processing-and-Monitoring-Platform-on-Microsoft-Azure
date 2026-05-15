param(
    [string]$ApiBase = $env:APP_API_BASE
)

if ([string]::IsNullOrWhiteSpace($ApiBase)) {
    $ApiBase = "https://kelompok11cc.my.id/api"
}

$ApiBase = $ApiBase.TrimEnd("/")
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "test+$timestamp@kelompok11cc.my.id"
$password = "TestPassword123!"

function Invoke-JsonRequest {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [string]$Token = ""
    )

    $headers = @{
        "Accept" = "application/json"
    }

    if (-not [string]::IsNullOrWhiteSpace($Token)) {
        $headers["Authorization"] = "Bearer $Token"
    }

    $params = @{
        Method      = $Method
        Uri         = "$ApiBase/$Path"
        Headers     = $headers
        ErrorAction = "Stop"
    }

    if ($null -ne $Body) {
        $params["ContentType"] = "application/json"
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    }

    Invoke-RestMethod @params
}

function Invoke-MultipartUpload {
    param(
        [string]$Path,
        [string]$Token,
        [string]$CsvContent,
        [string]$FileName
    )

    Add-Type -AssemblyName System.Net.Http

    $client = [System.Net.Http.HttpClient]::new()
    $multipart = [System.Net.Http.MultipartFormDataContent]::new()

    try {
        $client.DefaultRequestHeaders.Accept.ParseAdd("application/json")
        if (-not [string]::IsNullOrWhiteSpace($Token)) {
            $client.DefaultRequestHeaders.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Token)
        }

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($CsvContent)
        $fileContent = [System.Net.Http.ByteArrayContent]::new($bytes)
        $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new("text/csv")
        $multipart.Add($fileContent, "file", $FileName)

        $response = $client.PostAsync("$ApiBase/$Path", $multipart).GetAwaiter().GetResult()
        $responseBody = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()

        if (-not $response.IsSuccessStatusCode) {
            throw "HTTP $([int]$response.StatusCode): $responseBody"
        }

        $responseBody | ConvertFrom-Json
    }
    finally {
        $multipart.Dispose()
        $client.Dispose()
    }
}

Write-Host "Testing API base: $ApiBase"
Write-Host "Test user: $email"

try {
    Write-Host "`n[1/5] Register user..."
    $register = Invoke-JsonRequest -Method "POST" -Path "register" -Body @{
        name     = "Test User"
        email    = $email
        password = $password
    }
    if (-not $register.success -or [string]::IsNullOrWhiteSpace($register.token)) {
        throw "Register response tidak valid"
    }
    Write-Host "OK register: $($register.user.email)"

    Write-Host "`n[2/5] Login user..."
    $login = Invoke-JsonRequest -Method "POST" -Path "login" -Body @{
        email    = $email
        password = $password
    }
    if (-not $login.success -or [string]::IsNullOrWhiteSpace($login.token)) {
        throw "Login response tidak valid"
    }
    Write-Host "OK login: $($login.user.email)"

    $token = $login.token

    Write-Host "`n[3/5] Get current user..."
    $me = Invoke-JsonRequest -Method "GET" -Path "me" -Token $token
    if (-not $me.success -or $me.user.email -ne $email) {
        throw "Current user response tidak valid"
    }
    Write-Host "OK me: $($me.user.name)"

    Write-Host "`n[4/5] Get stats..."
    $stats = Invoke-JsonRequest -Method "GET" -Path "stats" -Token $token
    if (-not $stats.success) {
        throw "Stats response tidak valid"
    }
    Write-Host "OK stats total_records: $($stats.stats.total_records)"

    Write-Host "`n[5/5] Upload sample CSV telemetry..."
    $csv = @"
deviceId,temperature,level,message
test-device-01,31,,
test-device-02,86,,
test-app-01,,INFO,Auth database test upload
"@
    $upload = Invoke-MultipartUpload -Path "upload" -Token $token -CsvContent $csv -FileName "sample-telemetry.csv"
    if (-not $upload.success) {
        throw "Upload response tidak valid"
    }
    Write-Host "OK upload count: $($upload.count)"

    Write-Host "`nAll checks passed."
    Write-Host "Register/login database container 'users' berhasil diuji lewat API."
}
catch {
    Write-Error "Test gagal: $($_.Exception.Message)"
    exit 1
}
