// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ConstiCoin is ERC20, Ownable {
    uint256 public constant TARGET_SILVER_GRAINS = 371.25e18;
    uint256 public constant SILVER_MULTIPLIER = 7734375;

    uint256 public transferFeePercent = 50;
    mapping(address => uint256) public pendingRewards;
    uint256 public totalPendingRewards;
    address[] public holders;

    mapping(address => bool) public isHolder;
    mapping(address => bool) public isAIAgent;
    mapping(address => uint256) public agentTypes;

    address public centralBank;
    address public liquidityPool;

    uint256 public holderShare = 5000;
    uint256 public botShare = 3000;
    uint256 public lpShare = 2000;

    event FeeDistributed(address indexed from, uint256 feeAmount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event AgentRegistered(address indexed agent, uint256 agentType);
    event FeeUpdated(uint256 newFee);

    modifier onlyAIAgent(uint256 _type) {
        require(isAIAgent[msg.sender] && agentTypes[msg.sender] == _type, "Not authorized");
        _;
    }

    constructor() ERC20("ConstiCoin", "CONSTI") Ownable(msg.sender) {
        _mint(msg.sender, 0);
    }

    function setCentralBank(address _cb) external {
        require(centralBank == address(0), "Already set");
        centralBank = _cb;
    }

    function setLiquidityPool(address _lp) external {
        require(liquidityPool == address(0), "Already set");
        liquidityPool = _lp;
    }
    
    function updateLiquidityPool(address _lp) external onlyOwner {
        liquidityPool = _lp;
    }

    function registerAgent(address _agent, uint256 _type) external {
        require(msg.sender == centralBank, "Only central bank");
        require(!isAIAgent[_agent], "Already registered");
        isAIAgent[_agent] = true;
        agentTypes[_agent] = _type;
        emit AgentRegistered(_agent, _type);
    }

    function setTransferFee(uint256 _newFee) external onlyAIAgent(3) {
        require(_newFee <= 100, "Max 1%");
        transferFeePercent = _newFee;
        emit FeeUpdated(_newFee);
    }

    function setFeeDistribution(uint256 _holder, uint256 _bot, uint256 _lp) external onlyAIAgent(4) {
        require(_holder + _bot + _lp == 10000, "Must equal 100%");
        holderShare = _holder;
        botShare = _bot;
        lpShare = _lp;
    }

    function _addHolder(address _holder) internal {
        if (!isHolder[_holder]) {
            isHolder[_holder] = true;
            holders.push(_holder);
        }
    }

    function _distributeFee(uint256 _fee) internal {
        if (_fee == 0 || totalSupply() == 0) return;
        uint256 toHolders = (_fee * holderShare) / 10000;
        totalPendingRewards += toHolders;
        emit FeeDistributed(msg.sender, toHolders);
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        uint256 fee = (amount * transferFeePercent) / 10000;
        uint256 netAmount = amount - fee;
        if (fee > 0) _distributeFee(fee);
        _addHolder(to);
        super.transfer(to, netAmount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        uint256 fee = (amount * transferFeePercent) / 10000;
        uint256 netAmount = amount - fee;
        if (fee > 0) _distributeFee(fee);
        _addHolder(to);
        super.transferFrom(from, to, netAmount);
        return true;
    }

    function claimRewards() external {
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No pending rewards");
        pendingRewards[msg.sender] = 0;
        totalPendingRewards -= reward;
        payable(msg.sender).transfer(reward);
        emit RewardsClaimed(msg.sender, reward);
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == centralBank, "Only central bank");
        _mint(to, amount);
    }

    function emergencyMint(address to, uint256 amount) external {
        require(msg.sender == centralBank || msg.sender == owner(), "Not authorized");
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        require(msg.sender == centralBank, "Only central bank");
        _burn(msg.sender, amount);
    }

    function getHoldersCount() external view returns (uint256) {
        return holders.length;
    }

    function getHolder(uint256 _index) external view returns (address) {
        return holders[_index];
    }

    receive() external payable {}
}