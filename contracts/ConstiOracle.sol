// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ConstiOracle is Ownable {
    uint256 public silverPriceUSD;
    uint256 public lastUpdate;
    uint256 public stalenessThreshold = 5 minutes;
    
    event PriceUpdated(uint256 price, uint256 timestamp);
    
    constructor() Ownable(msg.sender) {
        lastUpdate = block.timestamp;
    }
    
    function updatePrice(uint256 _price) external onlyOwner {
        require(_price > 0 && _price < 100000, "Invalid price"); // $0 - $100k
        silverPriceUSD = _price;
        lastUpdate = block.timestamp;
        emit PriceUpdated(_price, block.timestamp);
    }
    
    function getSilverPrice() external view returns (uint256) {
        return silverPriceUSD;
    }
    
    function isStale() public view returns (bool) {
        return block.timestamp > lastUpdate + stalenessThreshold;
    }
    
    function setStalenessThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold >= 1 minutes && _threshold <= 1 days, "Invalid threshold");
        stalenessThreshold = _threshold;
    }
}
