#!/bin/bash
# Bash script to deploy PayrollDapp to Sepolia testnet
# Usage:
#   export SEPOLIA_RPC_URL="https://your-custom-rpc-url.com"
#   export MNEMONIC="your twelve word mnemonic phrase here"
#   ./deploy-sepolia.sh

echo "========================================="
echo "Deploying PayrollDapp to Sepolia Testnet"
echo "========================================="
echo ""

# Check if required environment variables are set
if [ -z "$SEPOLIA_RPC_URL" ]; then
    echo "ERROR: SEPOLIA_RPC_URL environment variable is not set!"
    echo "Please set it using: export SEPOLIA_RPC_URL='https://your-rpc-url.com'"
    exit 1
fi

if [ -z "$MNEMONIC" ]; then
    echo "ERROR: MNEMONIC environment variable is not set!"
    echo "Please set it using: export MNEMONIC='your twelve word mnemonic phrase here'"
    exit 1
fi

echo "Configuration:"
echo "  RPC URL: $SEPOLIA_RPC_URL"
echo "  Network: Sepolia (Chain ID: 11155111)"
echo "  Mnemonic: ${MNEMONIC:0:20}..."
echo ""

# Compile contracts
echo "Step 1: Compiling contracts..."
npm run compile
if [ $? -ne 0 ]; then
    echo "ERROR: Contract compilation failed!"
    exit 1
fi
echo "✓ Contracts compiled successfully"
echo ""

# Deploy to Sepolia
echo "Step 2: Deploying to Sepolia testnet..."
npx hardhat deploy --network sepolia
if [ $? -ne 0 ]; then
    echo "ERROR: Deployment failed!"
    exit 1
fi
echo "✓ Deployment completed successfully"
echo ""

# Generate ABI files for frontend
echo "Step 3: Generating ABI files for frontend..."
cd ../frontend
npm run genabi
if [ $? -ne 0 ]; then
    echo "WARNING: ABI generation failed, but deployment was successful"
else
    echo "✓ ABI files generated successfully"
fi
echo ""

echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Check the deployment address in contracts/deployments/sepolia/"
echo "  2. Verify the contract on Etherscan (optional):"
echo "     npx hardhat verify --network sepolia <CONTRACT_ADDRESS>"
echo "  3. Update frontend configuration if needed"
echo ""

