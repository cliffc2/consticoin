// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

interface ICentralBank {
    function requestL1Contraction(uint256 amount) external;
    function getDeviation() external view returns (uint256);
    function getPoolPrice() external view returns (uint256);
    function getTargetPrice() external view returns (uint256);
    function isEmergencyUnwindReady() external view returns (bool);
}

interface ILiquidityPool {
    function swapIKASForConsti() external payable;
}

contract ConstiBridge is Ownable {
    ICentralBank public centralBank;
    address public reserveVault;
    uint256 public minContractionAmount = 1e18;
    bool public paused = false;
    
    event ContractionRequested(uint256 amount, uint256 deviation, uint256 timestamp);
    event EmergencyUnwindRequested(uint256 timestamp);
    event ReservesWithdrawn(uint256 amount, address recipient);

    modifier whenNotPaused() {
        require(!paused, "Bridge paused");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setCentralBank(address _centralBank) external onlyOwner {
        centralBank = ICentralBank(_centralBank);
    }

    function setReserveVault(address _vault) external onlyOwner {
        reserveVault = _vault;
    }

    function setMinContractionAmount(uint256 _amount) external onlyOwner {
        minContractionAmount = _amount;
    }

    function pauseBridge() external onlyOwner {
        paused = !paused;
    }

    function requestContraction(uint256 amount) external whenNotPaused {
        require(address(centralBank) != address(0), "No central bank");
        require(amount >= minContractionAmount, "Amount too small");
        
        uint256 deviation = centralBank.getDeviation();
        require(deviation > 1000, "Not under peg"); // Must be >10% deviation
        
        emit ContractionRequested(amount, deviation, block.timestamp);
        
        // Call CentralBank to trigger contraction event
        centralBank.requestL1Contraction(amount);
    }

    function requestEmergencyUnwind() external onlyOwner {
        require(address(centralBank) != address(0), "No central bank");
        require(centralBank.isEmergencyUnwindReady(), "Emergency not ready");
        
        emit EmergencyUnwindRequested(block.timestamp);
    }

    function withdrawReserves(uint256 amount, address recipient) external onlyOwner {
        require(amount > 0, "Zero amount");
        require(recipient != address(0), "Invalid recipient");
        
        emit ReservesWithdrawn(amount, recipient);
    }

    // Bridge helper to check if ready for contraction
    function canContract() external view returns (bool) {
        if (paused) return false;
        if (address(centralBank) == address(0)) return false;
        
        uint256 deviation = centralBank.getDeviation();
        return deviation > 1000;
    }

    // Get current bridge status
    function getBridgeStatus() external view returns (
        bool paused_,
        bool canContract_,
        uint256 deviation,
        uint256 poolPrice,
        uint256 targetPrice
    ) {
        paused_ = paused;
        canContract_ = canContraction();
        deviation = centralBank.getDeviation();
        poolPrice = centralBank.getPoolPrice();
        targetPrice = centralBank.getTargetPrice();
    }
}
