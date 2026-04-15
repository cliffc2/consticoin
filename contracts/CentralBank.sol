// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CentralBank is Ownable {
    enum AgentType { MARKET_DATA, QUANT, FUNDAMENTALS, SENTIMENT, RISK_MANAGER, PORTFOLIO_MANAGER }

    uint256 public constant SILVER_MULTIPLIER = 7734375;
    uint256 public constant TARGET_SILVER_GRAINS = 371.25e18;
    
    // MetalMetric oracle configuration
    address public oracleUpdater = address(0);
    uint256 public oracleStalenessThreshold = 5 minutes;

    uint256 public expansionLimit = 200;
    uint256 public contractionLimit = 200;
    uint256 public interventionThreshold = 100;
    uint256 public cooldownPeriod = 1 hours;
    uint256 public lastRebaseTime;

    uint256 public currentSilverPrice;
    uint256 public lastPriceUpdate;
    uint256 public priceStalenessThreshold = 1 hours;

    bool public paused = false;
    bool public circuitBreakerTriggered = false;

    mapping(address => bool) public isAIAgent;
    mapping(address => AgentType) public agentTypes;

    address public constiCoin;
    address public liquidityPool;
    address public reserve;
    address public bridge;
    
    uint256 public maxDeviationBps = 1000;
    uint256 public emergencyUnlockDelay = 48 hours;
    bool public emergencyUnwindTriggered = false;
    uint256 public emergencyUnlockTime;

    event PriceSubmitted(address indexed agent, uint256 price);
    event RebaseTriggered(uint256 expansion, uint256 contraction);
    event ParametersAdjusted(uint256 expLimit, uint256 contLimit, uint256 thresh);
    event EmergencyPause(bool paused);
    event CircuitBreaker(uint256 price, uint256 target, uint256 deviation);
    event L1ContractionRequested(uint256 amount, uint256 timestamp);
    event EmergencyUnwindTriggered(uint256 timestamp);
    event BridgeSet(address indexed bridge);

    modifier onlyAIAgent(AgentType _type) {
        require(isAIAgent[msg.sender] && agentTypes[msg.sender] == _type, "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Protocol paused");
        _;
    }

    constructor() Ownable(msg.sender) {
        lastRebaseTime = block.timestamp;
    }

    function setConstiCoin(address _token) external onlyOwner {
        require(constiCoin == address(0), "Already set");
        constiCoin = _token;
    }

    function setLiquidityPool(address _lp) external onlyOwner {
        require(liquidityPool == address(0), "Already set");
        liquidityPool = _lp;
    }

    function setReserve(address _reserve) external onlyOwner {
        require(reserve == address(0), "Already set");
        reserve = _reserve;
    }

    function setBridge(address _bridge) external onlyOwner {
        require(_bridge != address(0), "Invalid bridge");
        bridge = _bridge;
        emit BridgeSet(_bridge);
    }

    function setEmergencyParams(uint256 _maxDeviationBps, uint256 _delay) external onlyOwner {
        require(_maxDeviationBps >= 500 && _maxDeviationBps <= 5000, "Deviation 5-50%");
        require(_delay >= 1 hours && _delay <= 7 days, "Delay 1h-7d");
        maxDeviationBps = _maxDeviationBps;
        emergencyUnlockDelay = _delay;
    }

    function requestL1Contraction(uint256 amount) external onlyAIAgent(AgentType.QUANT) {
        require(bridge != address(0), "No bridge");
        uint256 poolPrice = getPoolPrice();
        uint256 targetPrice = getTargetPrice();
        require(poolPrice > 0 && poolPrice < (targetPrice * 99) / 100, "Not under peg");
        
        emit L1ContractionRequested(amount, block.timestamp);
        
        // Forward to bridge for L1 covenant
        IConstiBridge(bridge).requestContraction(amount);
    }

    function triggerEmergencyUnwind() external onlyAIAgent(AgentType.RISK_MANAGER) {
        require(!emergencyUnwindTriggered, "Already triggered");
        emergencyUnwindTriggered = true;
        emergencyUnlockTime = block.timestamp + emergencyUnlockDelay;
        emit EmergencyUnwindTriggered(emergencyUnlockTime);
    }

    function cancelEmergencyUnwind() external onlyOwner {
        emergencyUnwindTriggered = false;
        emergencyUnlockTime = 0;
    }

    function isEmergencyUnwindReady() public view returns (bool) {
        return emergencyUnwindTriggered && block.timestamp >= emergencyUnlockTime;
    }

    function getDeviation() public view returns (uint256) {
        uint256 poolPrice = getPoolPrice();
        uint256 targetPrice = getTargetPrice();
        if (poolPrice == 0 || targetPrice == 0) return 0;
        return poolPrice > targetPrice 
            ? ((poolPrice - targetPrice) * 10000) / targetPrice 
            : ((targetPrice - poolPrice) * 10000) / targetPrice;
    }

    function registerAgent(address _agent, AgentType _type) external onlyOwner {
        require(!isAIAgent[_agent], "Already registered");
        isAIAgent[_agent] = true;
        agentTypes[_agent] = _type;
    }

    function submitPrice(uint256 _price) external onlyAIAgent(AgentType.MARKET_DATA) {
        _submitPrice(_price);
    }
    
    function submitPriceOwner(uint256 _price) external onlyOwner {
        _submitPrice(_price);
    }
    
    function _submitPrice(uint256 _price) internal {
        require(_price > 0, "Invalid price");
        currentSilverPrice = _price;
        lastPriceUpdate = block.timestamp;
        circuitBreakerTriggered = false;
        emit PriceSubmitted(msg.sender, _price);
    }
    
    function submitPriceFromOracle() external {
        require(msg.sender == oracleUpdater || oracleUpdater == address(0), "Not oracle updater");
        (bool success, bytes memory data) = oracleUpdater.staticcall(
            abi.encodeWithSignature("getSilverPrice()")
        );
        require(success, "Oracle call failed");
        uint256 price = abi.decode(data, (uint256));
        require(price > 0, "Invalid oracle price");
        currentSilverPrice = price;
        lastPriceUpdate = block.timestamp;
        circuitBreakerTriggered = false;
        emit PriceSubmitted(msg.sender, price);
    }
    
    function setOracleUpdater(address _updater) external onlyOwner {
        oracleUpdater = _updater;
    }
    
    function isOracleFresh() external view returns (bool) {
        return !isPriceStale();
    }

    function getTargetPrice() public view returns (uint256) {
        require(currentSilverPrice > 0, "No price");
        // silverPrice in dollars * multiplier * 1e18 = target in wei
        // $79 * 0.7734375 * 1e18 = 61101562500000000000000 wei = 61.1 iKAS
        return (currentSilverPrice * SILVER_MULTIPLIER * 1e18) / 1e7;
    }

    function getPoolPrice() public view returns (uint256) {
        if (liquidityPool == address(0)) return 0;
        (bool success, bytes memory data) = liquidityPool.staticcall(abi.encodeWithSignature("getPrice()"));
        if (!success) return 0;
        return abi.decode(data, (uint256));
    }

    function rebase() external onlyAIAgent(AgentType.QUANT) whenNotPaused {
        require(block.timestamp >= lastRebaseTime + cooldownPeriod, "Cooldown");
        require(currentSilverPrice > 0, "No price");

        uint256 poolPrice = getPoolPrice();
        uint256 targetPrice = getTargetPrice();

        if (poolPrice == 0) return;

        uint256 upperThreshold = (targetPrice * (10000 + interventionThreshold)) / 10000;
        uint256 lowerThreshold = (targetPrice * (10000 - interventionThreshold)) / 10000;

        if (poolPrice > upperThreshold) {
            uint256 supply = IERC20(constiCoin).totalSupply();
            uint256 maxExpansion = (supply * expansionLimit) / 10000;
            uint256 deviation = ((poolPrice - targetPrice) * 10000) / targetPrice;
            uint256 expansion = (maxExpansion * deviation) / 10000;
            if (expansion > maxExpansion) expansion = maxExpansion;
            if (expansion > 0) {
                IConstiCoin(constiCoin).mint(address(this), expansion);
                lastRebaseTime = block.timestamp;
                emit RebaseTriggered(expansion, 0);
            }
        } else if (poolPrice < lowerThreshold) {
            uint256 supply = IERC20(constiCoin).totalSupply();
            uint256 maxContraction = (supply * contractionLimit) / 10000;
            uint256 deviation = ((targetPrice - poolPrice) * 10000) / targetPrice;
            uint256 contraction = (maxContraction * deviation) / 10000;
            if (contraction > maxContraction) contraction = maxContraction;
            if (contraction > 0) {
                IConstiCoin(constiCoin).burn(contraction);
                lastRebaseTime = block.timestamp;
                emit RebaseTriggered(0, contraction);
            }
        }
    }

    function adjustParameters(uint256 _expLimit, uint256 _contLimit, uint256 _thresh) 
        external onlyAIAgent(AgentType.RISK_MANAGER) {
        require(_expLimit <= 500, "Max 5%");
        require(_contLimit <= 500, "Max 5%");
        require(_thresh >= 50 && _thresh <= 500, "Threshold 0.5-5%");
        expansionLimit = _expLimit;
        contractionLimit = _contLimit;
        interventionThreshold = _thresh;
        emit ParametersAdjusted(_expLimit, _contLimit, _thresh);
    }

    function emergencyPause() external onlyAIAgent(AgentType.RISK_MANAGER) {
        paused = !paused;
        emit EmergencyPause(paused);
    }

    function checkCircuitBreaker() external {
        require(currentSilverPrice > 0 && !circuitBreakerTriggered, "No price or triggered");
        uint256 deviation = getDeviation();
        if (deviation > maxDeviationBps) {
            circuitBreakerTriggered = true;
            paused = true;
            uint256 targetPrice = getTargetPrice();
            uint256 poolPrice = getPoolPrice();
            emit CircuitBreaker(poolPrice, targetPrice, deviation);
        }
    }

    function isPriceStale() public view returns (bool) {
        return block.timestamp > lastPriceUpdate + priceStalenessThreshold;
    }

    function bootstrapMint(uint256 amount) external onlyOwner {
        require(IERC20(constiCoin).totalSupply() == 0, "Already bootstrapped");
        require(amount > 0 && amount <= 1000000e18, "Invalid bootstrap amount");
        IConstiCoin(constiCoin).mint(liquidityPool, amount);
    }

    function getReserves() public view returns (uint256) {
        if (reserve != address(0)) {
            return IERC20(reserve).balanceOf(address(this));
        }
        return 0;
    }
}

interface IConstiCoin {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
    function totalSupply() external view returns (uint256);
}

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

interface IConstiBridge {
    function requestContraction(uint256 amount) external;
}