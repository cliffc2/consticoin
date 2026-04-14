require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("\n=== ConstiCoin Bootstrap (Deploy Updated CentralBank) ===\n");
    
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const gasPrice = ethers.parseUnits("2200", "gwei");
    const deployOptions = { gasPrice: gasPrice, gasLimit: 3000000 };
    
    // Read artifact
    const artifactsPath = path.join(__dirname, '..', 'artifacts');
    const centralBankArtifact = JSON.parse(fs.readFileSync(path.join(artifactsPath, 'contracts', 'CentralBank.sol', 'CentralBank.json')));
    const CentralBank = new ethers.ContractFactory(centralBankArtifact.abi, centralBankArtifact.bytecode, wallet);
    
    // Deploy new CentralBank
    console.log("Deploying updated CentralBank with bootstrapMint...");
    const centralBank = await CentralBank.deploy(deployOptions);
    await centralBank.waitForDeployment();
    const centralBankAddress = await centralBank.getAddress();
    console.log("   New CentralBank:", centralBankAddress);
    
    // Get existing ConstiCoin and LiquidityPool
    const constiCoinAddr = "0xf654b3CBCE365062a35EEE758ace4f15Aa51B774";
    const liquidityPoolAddr = "0xe723Fb8b3841146a360A8cFa06090C7F3f41A032";
    
    // Set references
    const constiABI = ["function setCentralBank(address)"];
    const constiCoin = new ethers.Contract(constiCoinAddr, constiABI, wallet);
    await constiCoin.setCentralBank(centralBankAddress, deployOptions);
    console.log("   Updated ConstiCoin reference");
    
    // Bootstrap: Mint 10000 CONSTI to pool
    console.log("\nBootstrapping: Minting 10000 CONSTI to pool...");
    const tx = await centralBank.bootstrapMint(ethers.parseEther("10000"), deployOptions);
    await tx.wait();
    console.log("   Bootstrap complete!");
    
    // Verify
    console.log("\n=== Verification ===");
    const supplyABI = ["function totalSupply() view returns (uint256)"];
    const poolABI = ["function getReserves() view returns (uint256, uint256)"];
    const constiCoinCheck = new ethers.Contract(constiCoinAddr, supplyABI, provider);
    const poolCheck = new ethers.Contract(liquidityPoolAddr, poolABI, provider);
    
    const totalSupply = await constiCoinCheck.totalSupply();
    const [ikasReserve, constiReserve] = await poolCheck.getReserves();
    
    console.log("Total CONSTI Supply:", ethers.formatEther(totalSupply));
    console.log("Pool iKAS:", ethers.formatEther(ikasReserve));
    console.log("Pool CONSTI:", ethers.formatEther(constiReserve));
    
    // Save new deployment
    const deploymentInfo = {
        network: "galleon-testnet",
        chainId: 38836,
        contracts: {
            constiCoin: constiCoinAddr,
            centralBank: centralBankAddress,
            liquidityPool: liquidityPoolAddr
        },
        deployer: wallet.address,
        timestamp: new Date().toISOString()
    };
    fs.writeFileSync(path.join(__dirname, '..', 'deployments', 'deployment.json'), JSON.stringify(deploymentInfo, null, 2));
    console.log("\nNew deployment saved.");
    console.log("\n✅ Frontend ready: Open /Users/ghostgear/webbot3/frontend/consti.html");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });