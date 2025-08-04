# ============================================================================
# SSH Key Pair Generation Script for NRN Project
# ============================================================================

Write-Host "🔑 Generating new SSH key pair for NRN infrastructure..." -ForegroundColor Green

# Create keys directory if it doesn't exist
if (!(Test-Path "keys")) {
    New-Item -ItemType Directory -Name "keys"
}

# Generate new SSH key pair
Write-Host "Generating RSA key pair..." -ForegroundColor Yellow
ssh-keygen -t rsa -b 4096 -f "keys/nrn-key" -N '""' -C "nrn-infrastructure-key"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Key pair generated successfully!" -ForegroundColor Green
    
    # Copy to expected locations
    Copy-Item "keys/nrn-key" "team-key"
    Copy-Item "keys/nrn-key.pub" "team-key.pub"
    
    Write-Host "📁 Files created:" -ForegroundColor Cyan
    Write-Host "  - Private key: keys/nrn-key (and team-key)" -ForegroundColor White
    Write-Host "  - Public key: keys/nrn-key.pub (and team-key.pub)" -ForegroundColor White
    
    Write-Host "`n🔒 Private Key Content (for GitHub Secret):" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Get-Content "team-key" | Write-Host -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Yellow
    
    Write-Host "`n🔓 Public Key Content:" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Get-Content "team-key.pub" | Write-Host -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Yellow
    
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Copy the PRIVATE key content above to GitHub Secret 'TEAM_SSH_KEY'" -ForegroundColor White
    Write-Host "2. Run: terraform plan" -ForegroundColor White
    Write-Host "3. Run: terraform apply" -ForegroundColor White
    Write-Host "4. Wait for infrastructure update to complete" -ForegroundColor White
    Write-Host "5. Run your GitHub Action workflow" -ForegroundColor White
    
} else {
    Write-Host "❌ Failed to generate key pair" -ForegroundColor Red
    Write-Host "Make sure you have ssh-keygen installed" -ForegroundColor Yellow
}
