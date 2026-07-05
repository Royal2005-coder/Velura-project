Write-Host "Starting Velura API on port 8787..."
node --env-file=.env apps/api/src/server.js
