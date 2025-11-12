// Check if Hardhat node is running
import { JsonRpcProvider } from "ethers";

async function checkHardhatNode() {
  try {
    const provider = new JsonRpcProvider("http://localhost:8545");
    const blockNumber = await provider.getBlockNumber();
    console.log(`Hardhat node is running at block ${blockNumber}`);
    process.exit(0);
  } catch (error) {
    console.error("Hardhat node is not running. Please start it with: npx hardhat node");
    process.exit(1);
  }
}

checkHardhatNode();

