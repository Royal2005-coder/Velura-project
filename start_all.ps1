# Start all Velura services and Cloudflare tunnels

# Ensure logs directory exists
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

# Helper function to stop processes listening on specific ports
function Stop-Process-On-Port($port) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($conn in $conns) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill) {
                Write-Host "Stopping process $pidToKill listening on port $port..."
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Host "Cleaning up existing processes on ports 8787, 5174, and 3001..."
Stop-Process-On-Port 8787
Stop-Process-On-Port 5174
Stop-Process-On-Port 3001

Write-Host "Stopping existing cloudflared processes..."
Get-Process -Name cloudflared -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }

# Wait a moment to ensure ports are freed
Start-Sleep -Seconds 2

Write-Host "Starting Velura API Backend (port 8787)..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run api:dev > logs/api.log 2>&1" -WorkingDirectory "C:\Users\UEL\.gemini\antigravity-ide\scratch\Velura-project"

Write-Host "Starting Velura Admin Web (port 5174)..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run admin:dev > logs/admin.log 2>&1" -WorkingDirectory "C:\Users\UEL\.gemini\antigravity-ide\scratch\Velura-project"

Write-Host "Starting Velura User Web (port 3001)..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run user:dev > logs/user.log 2>&1" -WorkingDirectory "C:\Users\UEL\.gemini\antigravity-ide\scratch\Velura-project"

# Wait for local web servers to boot
Start-Sleep -Seconds 3

Write-Host "Starting Cloudflare Tunnel for admin.royalai.dev..."
$cloudflaredPath = "${env:ProgramFiles(x86)}\cloudflared\cloudflared.exe"
$tokenAdmin = "eyJhIjoiMmQxNjczNWU1MjY4MGE3YWNjMjE5NDBmZjE4ZTNkMGYiLCJ0IjoiOWQ0YzU2NzktMzU0MS00NzI2LWFjNzQtZDFkYWNiZjA2ZmQxIiwicyI6IlltWTBZbVkyWmpFdE5UZ3dZUzAwTURVNExUbGlNREV0WW1RNVlUbGhOek15WW1KaCJ9"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$cloudflaredPath`" tunnel run --no-tls-verify --origin-ca-pool certs\cert.pem --token $tokenAdmin > logs/cf_admin.log 2>&1" -WorkingDirectory "C:\Users\UEL\.gemini\antigravity-ide\scratch\Velura-project"

Write-Host "Starting Cloudflare Tunnel for velura.royalai.dev..."
$tokenUser = "eyJhIjoiMmQxNjczNWU1MjY4MGE3YWNjMjE5NDBmZjE4ZTNkMGYiLCJ0IjoiMDI2OWFlZWYtNjI4NC00MzU4LTgxY2ItMjU1YmQ4MGJhMmViIiwicyI6Ik1UVm1NbUptTTJZdFl6ZzVOQzAwTUdKaUxUZ3paRGN0TWpVM04ySmhPR0UzTkRCbCJ9"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$cloudflaredPath`" tunnel run --no-tls-verify --origin-ca-pool certs\cert.pem --token $tokenUser > logs/cf_user.log 2>&1" -WorkingDirectory "C:\Users\UEL\.gemini\antigravity-ide\scratch\Velura-project"

Write-Host "All services successfully started in the background!"
Write-Host "You can view logs under the 'logs' folder:"
Write-Host " - logs/api.log"
Write-Host " - logs/admin.log"
Write-Host " - logs/user.log"
Write-Host " - logs/cf_admin.log"
Write-Host " - logs/cf_user.log"

Write-Host "Keeping script alive to maintain background services..."
while ($true) {
    Start-Sleep -Seconds 10
}
