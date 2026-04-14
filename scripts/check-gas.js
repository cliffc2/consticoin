const ethers = require("ethers");

const RPC_URL = "https://galleon-testnet.igralabs.com:8545";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const feeData = await provider.getFeeData();
    console.log("Current gas prices:");
    console.log("  gasPrice:", feeData.gasPrice?.toString());
    console.log("  maxFeePerGas:", feeData.maxFeePerGas?.toString());
    console.log("  maxPriorityFeePerGas:", feeData.maxPriorityFeePerGas?.toString());
}

main().catch(console.error);
