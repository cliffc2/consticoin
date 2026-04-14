require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("\n=== Deploy Updated ConstiCoin ===\n");
    
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const gasPrice = ethers.parseUnits("2200", "gwei");
    const deployOptions = { gasPrice: gasPrice, gasLimit: 3000000 };
    
    const artifactsPath = path.join(__dirname, '..', 'artifacts');
    const constiArtifact = JSON.parse(fs.readFileSync(path.join(artifactsPath, 'contracts', 'ConstiCoin.sol', 'ConstiCoin.json')));
    const ConstiCoin = new ethers.ContractFactory(constiArtifact.abi, constiArtifact.bytecode, wallet);
    
    // Deploy new ConstiCoin
    console.log("Deploying ConstiCoin with emergencyMint...");
    const constiCoin = await ConstiCoin.deploy(deployOptions);
    await constiCoin.waitForDeployment();
    const constiCoinAddr = await constiCoin.getAddress();
    console.log("   ConstiCoin:", constiCoinAddr);
    
    // Deploy CentralBank
    const bankArtifact = JSON.parse(fs.readFileSync(path.join(artifactsPath, 'contracts', 'CentralBank.sol', 'CentralBank.json')));
    const CentralBank = new ethers.ContractFactory(bankArtifact.abi, bankArtifact.bytecode, wallet);
    
    console.log("\nDeploying CentralBank...");
    const centralBank = await CentralBank.deploy(deployOptions);
    await centralBank.waitForDeployment();
    const centralBankAddr = await centralBank.getAddress();
    console.log("   CentralBank:", centralBankAddr);
    
    // Deploy LiquidityPool
    const poolArtifact = JSON.parse(fs.readFileSync(path.join(artifactsPath, 'contracts', 'LiquidityPool.sol', 'LiquidityPool.json')));
    const LiquidityPool = new ethers.ContractFactory(poolArtifact.abi, poolArtifact.bytecode, wallet);
    
    console.log("\nDeploying LiquidityPool...");
    const liquidityPool = await LiquidityPool.deploy(wallet.address, constiCoinAddr, deployOptions);
    await liquidityPool.waitForDeployment();
    const liquidityPoolAddr = await liquidityPool.getAddress();
    console.log("   LiquidityPool:", liquidityPoolAddr);
    
    // Set references
    console.log("\nSetting references...");
    await constiCoin.setCentralBank(centralBankAddr, deployOptions);
    await constiCoin.setLiquidityPool(liquidityPoolAddr, deployOptions);
    await centralBank.setConstiCoin(constiCoinAddr, deployOptions);
    await centralBank.setLiquidityPool(liquidityPoolAddr, deployOptions);
    
    // Bootstrap: Mint 10000 CONSTI to pool
    console.log("\nBootstrapping: Minting 10000 CONSTI to pool...");
    const tx = await constiCoin.emergencyMint(liquidityPoolAddr, ethers.parseEther("10000"), deployOptions);
    await tx.wait();
    console.log("   Done!");
    
    // Verify
    console.log("\n=== Final Status ===");
    const supplyABI = ["function totalSupply() view returns (uint256)"];
    const poolABI = ["function getReserves() view returns (uint256, uint256)"];
    const constiCoinCheck = new ethers.Contract(constiCoinAddr, supplyABI, provider);
    const poolCheck = new ethers.Contract(liquidityPoolAddr, poolABI, provider);
    
    const totalSupply = await constiCoinCheck.totalSupply();
    const [ikasReserve, constiReserve] = await poolCheck.getReserves();
    
    console.log("CONSTI Total Supply:", ethers.formatEther(totalSupply));
    console.log("Pool iKAS:", ethers.formatEther(ikasReserve));
    console.log("Pool CONSTI:", ethers.formatEther(constiReserve));
    
    // Save
    const deploymentInfo = {
        network: "galleon-testnet",
        chainId: 38836,
        contracts: {
            constiCoin: constiCoinAddr,
            centralBank: centralBankAddr,
            liquidityPool: liquidityPoolAddr
        },
        deployer: wallet.address,
        timestamp: new Date().toISOString()
    };
    fs.writeFileSync(path.join(__dirname, '..', 'deployments', 'deployment.json'), JSON.stringify(deploymentInfo, null, 2));
    console.log("\n✅ Deployment saved!");
    console.log("\nFrontend: /Users/ghostgear/webbot3/frontend/consti.html");
    console.log("Update contract addresses in the HTML if needed.");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);