param(
    [Parameter(Mandatory = $true)]
    [string]$Name,

    [Parameter(Mandatory = $true)]
    [string]$Email,

    [securestring]$Password
)

$ErrorActionPreference = "Stop"

if ($null -eq $Password) {
    $Password = Read-Host -Prompt "Admin password" -AsSecureString
}

$passwordPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
try {
    $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPtr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPtr)
}

if ([string]::IsNullOrWhiteSpace($plainPassword) -or $plainPassword.Length -lt 8) {
    throw "Password minimal 8 karakter"
}

$normalizedEmail = $Email.Trim().ToLowerInvariant()
if ($normalizedEmail -notmatch '^[^@\s]+@[^@\s]+\.[^@\s]+$') {
    throw "Email tidak valid"
}

function ConvertTo-Base64Url {
    param([byte[]]$Bytes)

    return [Convert]::ToBase64String($Bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

$iterations = 160000
$salt = [byte[]]::new(16)
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
try {
    $rng.GetBytes($salt)
}
finally {
    $rng.Dispose()
}

$derive = [Security.Cryptography.Rfc2898DeriveBytes]::new(
    $plainPassword,
    $salt,
    $iterations,
    [Security.Cryptography.HashAlgorithmName]::SHA256
)

try {
    $digest = $derive.GetBytes(32)
}
finally {
    $derive.Dispose()
}

$saltPart = ConvertTo-Base64Url -Bytes $salt
$digestPart = ConvertTo-Base64Url -Bytes $digest
$passwordHash = "pbkdf2_sha256`$$iterations`$$saltPart`$$digestPart"
$now = [DateTimeOffset]::UtcNow.ToString("o")

$adminUser = [ordered]@{
    id            = [Guid]::NewGuid().ToString()
    doc_type      = "user"
    name          = $Name.Trim()
    email         = $normalizedEmail
    role          = "admin"
    password_hash = $passwordHash
    created_at    = $now
    updated_at    = $now
}

Write-Host "Salin JSON berikut ke Cosmos DB container 'users'." -ForegroundColor Cyan
Write-Host "Partition key item: $normalizedEmail" -ForegroundColor Cyan
Write-Host ""
$adminUser | ConvertTo-Json -Depth 10
