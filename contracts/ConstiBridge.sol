// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICentralBank {
    function getDeviation() external view returns (uint256);
    function maxDeviationBps() external view returns (uint256);
    function getReserves() external view returns (uint256);
}

interface IConstiReserveVault {
    function contractReserves(uint256 amount, bytes calldata proof) external;
    function emergencyUnwind() external;
}

contract ConstiBridge is Ownable, ReentrancyGuard {
    
    ICentralBank public centralBank;
    IConstiReserveVault public l1Vault;

    uint256 public constant MAX_WITHDRAWAL_PERCENT = 10;
    uint256 public lastContractionTime;
    uint256 public constant COOLDOWN = 1 hours;

    event ContractionRequested(uint256 amount, uint256 deviationBps, uint256 timestamp);
    event EmergencyUnwindRequested(uint256 timestamp);
    event BridgeStatusUpdated(bool healthy);

    constructor() Ownable(msg.sender) {}

    function setCentralBank(address _centralBank) external onlyOwner {
        require(_centralBank != address(0), "Invalid address");
        centralBank = ICentralBank(_centralBank);
    }

    function setL1Vault(address _l1Vault) external onlyOwner {
        require(_l1Vault != address(0), "Invalid address");
        l1Vault = IConstiReserveVault(_l1Vault);
    }

    function requestContraction(uint256 amount) external {
        require(msg.sender == address(centralBank), "Only CentralBank can request");
        require(block.timestamp >= lastContractionTime + COOLDOWN, "Cooldown active");
        require(amount > 0, "Amount must be > 0");

        uint256 deviation = centralBank.getDeviation();
        require(deviation > centralBank.maxDeviationBps(), "Deviation too small");

        uint256 maxAllowed = (centralBank.getReserves() * MAX_WITHDRAWAL_PERCENT) / 100;
        require(amount <= maxAllowed, "Exceeds max withdrawal limit");

        bytes memory proof = generateContractionProof(amount, deviation);

        emit ContractionRequested(amount, deviation, block.timestamp);

        if (address(l1Vault) != address(0)) {
            l1Vault.contractReserves(amount, proof);
        }

        lastContractionTime = block.timestamp;
    }

    function requestEmergencyUnwind() external {
        require(msg.sender == address(centralBank), "Only CentralBank can request");

        emit EmergencyUnwindRequested(block.timestamp);

        if (address(l1Vault) != address(0)) {
            l1Vault.emergencyUnwind();
        }
    }

    function generateContractionProof(uint256 amount, uint256 deviationBps) 
        internal view returns (bytes memory) 
    {
        return abi.encodePacked(
            uint8(1),
            amount,
            deviationBps,
            block.timestamp
        );
    }

    function generateEmergencyProof() internal view returns (bytes memory) {
        return abi.encodePacked(
            uint8(2),
            block.timestamp
        );
    }

    function canContraction() external view returns (bool) {
        if (block.timestamp < lastContractionTime + COOLDOWN) return false;
        return centralBank.getDeviation() > centralBank.maxDeviationBps();
    }

    function getBridgeStatus() external view returns (
        bool healthy,
        uint256 lastContraction,
        uint256 currentDeviation
    ) {
        healthy = address(centralBank) != address(0) && address(l1Vault) != address(0);
        lastContraction = lastContractionTime;
        currentDeviation = centralBank.getDeviation();
    }
}
