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
    
    console.log("Deploying new LiquidityPool with syncReserve()...");
    
    const deployOptions = { gasLimit: 1000000, gasPrice: ethers.parseUnits("2200", "gwei") };
    
    const liquidityPool = await LiquidityPool.deploy(
        "0x0000000000000000000000000000000000000000",
        CONSTI_ADDRESS,
        deployOptions
    );
    await liquidityPool.waitForDeployment();
    const newPoolAddr = await liquidityPool.getAddress();
    
    console.log("New Pool:", newPoolAddr);
    console.log("\nNow call syncReserve() to fix iKAS reserve...");
    
    const syncAbi = ["function syncReserve()"];
    const pool = new ethers.Contract(newPoolAddr, syncAbi, wallet);
    
    const syncTx = await pool.syncReserve(deployOptions);
    await syncTx.wait();
    console.log("✅ Reserve synced!");
    
    console.log("\nNow update references in ConstiCoin and CentralBank...");
    
    const constiAbi = ["function setLiquidityPool(address _lp)"];
    const centralAbi = ["function setLiquidityPool(address _lp)"];
    const consti = new ethers.Contract(CONSTI_ADDRESS, constiAbi, wallet);
    const centralBank = new ethers.Contract("0xf8bea045952b3a095AbC10d93139f8D08095403a", centralAbi, wallet);
    
    console.log("Setting ConstiCoin liquidityPool...");
    const tx1 = await consti.setLiquidityPool(newPoolAddr, deployOptions);
    await tx1.wait();
    
    console.log("Setting CentralBank liquidityPool...");
    const tx2 = await centralBank.setLiquidityPool(newPoolAddr, deployOptions);
    await tx2.wait();
    
    console.log("\nDone! New pool:", newPoolAddr);
}

main().catch(console.error);
