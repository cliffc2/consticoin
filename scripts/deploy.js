require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("\n=== ConstiCoin Deployment ===\n");
    
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log("Deployer:", wallet.address);
    console.log("Network Chain ID: 38836\n");
    
    // Explicit gas settings for IGRA (min ~2000 gwei on testnet)
    const gasPrice = ethers.parseUnits("2200", "gwei");
    const deployOptions = {
        gasPrice: gasPrice,
        gasLimit: 3000000
    };
    
    // Read artifacts
    const artifactsPath = path.join(__dirname, '..', 'artifacts');
    
    // Load ConstiCoin
    const constiCoinArtifact = JSON.parse(fs.readFileSync(path.join(artifactsPath, 'contracts', 'ConstiCoin.sol', 'ConstiCoin.json')));
    const ConstiCoin = new ethers.ContractFactory(constiCoinArtifact.abi, constiCoinArtifact.bytecode, wallet);
    
    console.log("1. Deploying ConstiCoin...");
    const constiCoin = await ConstiCoin.deploy(deployOptions);
    await constiCoin.waitForDeployment();
    const constiCoinAddress = await constiCoin.getAddress();
    console.log("   ConstiCoin:", constiCoinAddress);
    
    // Load CentralBank
    const centralBankArtifact = JSON.parse(fs.readFileSync(path.join(artifactsPath, 'contracts', 'CentralBank.sol', 'CentralBank.json')));
    const CentralBank = new ethers.ContractFactory(centralBankArtifact.abi, centralBankArtifact.bytecode, wallet);
    
    console.log("\n2. Deploying CentralBank...");
    const centralBank = await CentralBank.deploy(deployOptions);
    await centralBank.waitForDeployment();
    const centralBankAddress = await centralBank.getAddress();
    console.log("   CentralBank:", centralBankAddress);
    
    // Load LiquidityPool
    const liquidityPoolArtifact = JSON.parse(fs.readFileSync(path.join(artifactsPath, 'contracts', 'LiquidityPool.sol', 'LiquidityPool.json')));
    const LiquidityPool = new ethers.ContractFactory(liquidityPoolArtifact.abi, liquidityPoolArtifact.bytecode, wallet);
    
    console.log("\n3. Deploying LiquidityPool...");
    const liquidityPool = await LiquidityPool.deploy(wallet.address, constiCoinAddress, deployOptions);
    await liquidityPool.waitForDeployment();
    const liquidityPoolAddress = await liquidityPool.getAddress();
    console.log("   LiquidityPool:", liquidityPoolAddress);
    
    console.log("\n4. Setting contract references...");
    await constiCoin.setCentralBank(centralBankAddress, deployOptions);
    await constiCoin.setLiquidityPool(liquidityPoolAddress, deployOptions);
    await centralBank.setConstiCoin(constiCoinAddress, deployOptions);
    await centralBank.setLiquidityPool(liquidityPoolAddress, deployOptions);
    console.log("   References set");
    
    console.log("\n5. Registering AI Agents...");
    const agents = [
        { name: "MARKET_DATA", address: process.env.AGENT_MARKET_DATA, type: 0 },
        { name: "QUANT", address: process.env.AGENT_QUANT, type: 1 },
        { name: "FUNDAMENTALS", address: process.env.AGENT_FUNDAMENTALS, type: 2 },
        { name: "SENTIMENT", address: process.env.AGENT_SENTIMENT, type: 3 },
        { name: "RISK_MANAGER", address: process.env.AGENT_RISK_MANAGER, type: 4 },
        { name: "PORTFOLIO_MANAGER", address: process.env.AGENT_PORTFOLIO_MANAGER, type: 5 },
    ];
    
    for (const agent of agents) {
        if (agent.address && agent.address.startsWith("0x") && agent.address.length === 42) {
            await centralBank.registerAgent(agent.address, agent.type, deployOptions);
            await constiCoin.registerAgent(agent.address, agent.type, deployOptions);
            await liquidityPool.registerAgent(agent.address, agent.type, deployOptions);
            console.log(`   ${agent.name}: ${agent.address}`);
        }
    }
    
    console.log("\n=== Deployment Complete ===\n");
    console.log("Contracts:");
    console.log("  ConstiCoin:", constiCoinAddress);
    console.log("  CentralBank:", centralBankAddress);
    console.log("  LiquidityPool:", liquidityPoolAddress);
    console.log("\nPeg: 371.25 grains silver");
    console.log("Initial Supply: 0 (organic minting)");
    console.log("\nExplorer: https://explorer.galleon-testnet.igralabs.com");
    
    // Save deployment info
    const deploymentInfo = {
        network: "galleon-testnet",
        chainId: 38836,
        contracts: {
            constiCoin: constiCoinAddress,
            centralBank: centralBankAddress,
            liquidityPool: liquidityPoolAddress
        },
        deployer: wallet.address,
        timestamp: new Date().toISOString()
    };
    
    const deploymentPath = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentPath)) fs.mkdirSync(deploymentPath);
    fs.writeFileSync(path.join(deploymentPath, 'deployment.json'), JSON.stringify(deploymentInfo, null, 2));
    console.log("\nSaved to deployments/deployment.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });