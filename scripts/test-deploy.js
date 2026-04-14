const ethers = require("ethers");
const fs = require("fs");
const path = require("path");

const PRIV_KEY = "7039957ecf9fa672aa553f31445a336589bbf490cdd02007b21539ea5f4b098e";
const RPC_URL = "https://galleon-testnet.igralabs.com:8545";

const CONSTI_ADDRESS = "0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIV_KEY, provider);
    
    const artifactsPath = path.join(__dirname, "../artifacts");
    const poolArtifact = JSON.parse(fs.readFileSync(path.join(artifactsPath, "contracts/LiquidityPool.sol/LiquidityPool.json")));
    const LiquidityPool = new ethers.ContractFactory(poolArtifact.abi, poolArtifact.bytecode, wallet);
    
    console.log("Deploying new LiquidityPool...");
    
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice;
    console.log("Gas price:", gasPrice?.toString());
    
    const deployOptions = { gasPrice: gasPrice };
    
    const liquidityPool = await LiquidityPool.deploy(
        "0x0000000000000000000000000000000000000000",
        CONSTI_ADDRESS,
        deployOptions
    );
    await liquidityPool.waitForDeployment();
    const newPoolAddr = await liquidityPool.getAddress();
    
    console.log("New Pool:", newPoolAddr);
    
    const balance = await provider.getBalance(newPoolAddr);
    console.log("Pool balance:", ethers.formatEther(balance), "iKAS");
}

main().catch(console.error);
