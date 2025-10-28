# PowerShell script to deploy PayrollDapp to Sepolia testnet
# Usage:
#   $env:SEPOLIA_RPC_URL="https://your-custom-rpc-url.com"
#   $env:MNEMONIC="your twelve word mnemonic phrase here"
#   .\deploy-sepolia.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deploying PayrollDapp to Sepolia Testnet" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if required environment variables are set
if (-not $env:SEPOLIA_RPC_URL) {
    Write-Host "ERROR: SEPOLIA_RPC_URL environment variable is not set!" -ForegroundColor Red
    Write-Host "Please set it using: `$env:SEPOLIA_RPC_URL='https://your-rpc-url.com'" -ForegroundColor Yellow
    exit 1
}

if (-not $env:MNEMONIC) {
    Write-Host "ERROR: MNEMONIC environment variable is not set!" -ForegroundColor Red
    Write-Host "Please set it using: `$env:MNEMONIC='your twelve word mnemonic phrase here'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Configuration:" -ForegroundColor Green
Write-Host "  RPC URL: $env:SEPOLIA_RPC_URL" -ForegroundColor Gray
Write-Host "  Network: Sepolia (Chain ID: 11155111)" -ForegroundColor Gray
Write-Host "  Mnemonic: $($env:MNEMONIC.Substring(0, [Math]::Min(20, $env:MNEMONIC.Length)))..." -ForegroundColor Gray
Write-Host ""

# Compile contracts
Write-Host "Step 1: Compiling contracts..." -ForegroundColor Yellow
npm run compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Contract compilation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Contracts compiled successfully" -ForegroundColor Green
Write-Host ""

# Deploy to Sepolia
Write-Host "Step 2: Deploying to Sepolia testnet..." -ForegroundColor Yellow
npx hardhat deploy --network sepolia
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Deployment completed successfully" -ForegroundColor Green
Write-Host ""

# Generate ABI files for frontend
Write-Host "Step 3: Generating ABI files for frontend..." -ForegroundColor Yellow
cd ../frontend
npm run genabi
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: ABI generation failed, but deployment was successful" -ForegroundColor Yellow
} else {
    Write-Host "✓ ABI files generated successfully" -ForegroundColor Green
}
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Check the deployment address in contracts/deployments/sepolia/" -ForegroundColor Gray
Write-Host "  2. Verify the contract on Etherscan (optional):" -ForegroundColor Gray
Write-Host "     npx hardhat verify --network sepolia <CONTRACT_ADDRESS>" -ForegroundColor Gray
Write-Host "  3. Update frontend configuration if needed" -ForegroundColor Gray
Write-Host ""

