// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LiquidityPool is Ownable {
    IERC20 public immutable iKAS;
    IERC20 public immutable constiCoin;

    uint256 public iKASReserve;
    uint256 public totalLiquidity;

    uint256 public constant SWAP_FEE = 30;
    uint256 public constant FEE_DENOMINATOR = 10000;

    mapping(address => uint256) public liquidity;
    mapping(address => bool) public isAIAgent;
    mapping(address => uint256) public agentTypes;

    uint256 public holderFeeShare = 4000;
    uint256 public lpFeeShare = 6000;

    event AddLiquidity(address indexed provider, uint256 iKAS, uint256 consti);
    event RemoveLiquidity(address indexed provider, uint256 iKAS, uint256 consti);
    event Swap(address indexed user, uint256 inAmount, uint256 outAmount, bool isIKASwap);
    event FeeDistributed(uint256 toHolders, uint256 toLPs);
    event Rebalance(uint256 newIKAS, uint256 newConsti);
    event AgentRegistered(address indexed agent, uint256 agentType);

    modifier onlyAIAgent(uint256 _type) {
        require(isAIAgent[msg.sender] && agentTypes[msg.sender] == _type, "Not authorized");
        _;
    }

    constructor(address _iKAS, address _consti) Ownable(msg.sender) {
        iKAS = IERC20(_iKAS);
        constiCoin = IERC20(_consti);
    }

    function registerAgent(address _agent, uint256 _type) external onlyOwner {
        require(!isAIAgent[_agent], "Already registered");
        isAIAgent[_agent] = true;
        agentTypes[_agent] = _type;
        emit AgentRegistered(_agent, _type);
    }

    function getPrice() external view returns (uint256) {
        uint256 constiBal = constiCoin.balanceOf(address(this));
        if (constiBal == 0) return 0;
        return (iKASReserve * 1e18) / constiBal;
    }

    function addLiquidity() external payable {
        require(msg.value > 0, "No iKAS");
        require(constiCoin.balanceOf(address(this)) > 0, "No CONSTI in pool");
        
        uint256 iKASAmount = msg.value;
        uint256 constiBal = constiCoin.balanceOf(address(this));
        uint256 constiAmount = iKASReserve > 0 ? (iKASAmount * constiBal) / iKASReserve : iKASAmount;
        
        require(constiCoin.transferFrom(msg.sender, address(this), constiAmount), "CONSTI transfer failed");
        
        uint256 liquidityMinted;
        if (totalLiquidity == 0) {
            liquidityMinted = iKASAmount;
        } else {
            liquidityMinted = (iKASAmount * totalLiquidity) / iKASReserve;
        }
        
        iKASReserve += iKASAmount;
        totalLiquidity += liquidityMinted;
        liquidity[msg.sender] += liquidityMinted;
        
        emit AddLiquidity(msg.sender, iKASAmount, constiAmount);
    }

    function removeLiquidity(uint256 _liquidity) external {
        require(_liquidity > 0 && liquidity[msg.sender] >= _liquidity, "Insufficient liquidity");
        
        uint256 iKASAmount = (_liquidity * iKASReserve) / totalLiquidity;
        uint256 constiBal = constiCoin.balanceOf(address(this));
        uint256 constiAmount = (_liquidity * constiBal) / totalLiquidity;
        
        liquidity[msg.sender] -= _liquidity;
        iKASReserve -= iKASAmount;
        totalLiquidity -= _liquidity;
        
        payable(msg.sender).transfer(iKASAmount);
        constiCoin.transfer(msg.sender, constiAmount);
        
        emit RemoveLiquidity(msg.sender, iKASAmount, constiAmount);
    }

function swapIKASForConsti() external payable {
        require(msg.value > 0, "No iKAS sent");
        
        uint256 constiBal = constiCoin.balanceOf(address(this));
        require(constiBal > 0, "No CONSTI in pool");
        
        uint256 fee = (msg.value * SWAP_FEE) / FEE_DENOMINATOR;
        uint256 netIn = msg.value - fee;
        
        // Use tracked reserve or minimum 0.1 iKAS
        uint256 baseReserve = iKASReserve > 1e17 ? iKASReserve : 1e18;
        uint256 constiOut = (netIn * constiBal) / baseReserve;
        
        require(constiOut > 0, "Zero output - pool empty");
        require(constiBal >= constiOut, "Insufficient CONSTI");
        
        iKASReserve += netIn;
        
        _distributeSwapFee(fee);
        constiCoin.transfer(msg.sender, constiOut);
        
emit Swap(msg.sender, msg.value, constiOut, false);
    }
    
    function swapConstiForIKAS(uint256 _constiIn) external {
        require(_constiIn > 0, "No CONSTI");
        
        uint256 constiBal = constiCoin.balanceOf(address(this));
        require(constiBal > 0, "No CONSTI in pool");
        
        uint256 fee = (_constiIn * SWAP_FEE) / FEE_DENOMINATOR;
        uint256 netIn = _constiIn - fee;
        
        require(iKASReserve > 0, "No iKAS reserve");
        uint256 iKASOut = (netIn * iKASReserve) / constiBal;
        require(iKASOut > 0 && address(this).balance >= iKASOut, "Insufficient iKAS");
        
        // Check approval
        require(constiCoin.allowance(msg.sender, address(this)) >= _constiIn, "Need approve");
        
        constiCoin.transferFrom(msg.sender, address(this), _constiIn);
        iKASReserve -= iKASOut;
        
        _distributeSwapFee(fee);
        payable(msg.sender).transfer(iKASOut);
        
        emit Swap(msg.sender, _constiIn, iKASOut, true);
    }

    function _distributeSwapFee(uint256 _fee) internal {
        uint256 toHolders = (_fee * holderFeeShare) / 10000;
        uint256 toLPs = (_fee * lpFeeShare) / 10000;
        emit FeeDistributed(toHolders, toLPs);
    }

    function rebalance() external onlyAIAgent(5) {
        emit Rebalance(iKASReserve, constiCoin.balanceOf(address(this)));
    }

    function getReserves() external view returns (uint256, uint256) {
        return (iKASReserve, constiCoin.balanceOf(address(this)));
    }
    
    function seedLiquidity(uint256 constiAmount) external onlyOwner {
        require(constiCoin.transferFrom(msg.sender, address(this), constiAmount), "Transfer failed");
    }
    
    function syncReserve() external {
        // Anyone can sync - makes reserve match actual balance
        iKASReserve = address(this).balance;
    }
    
    function forceSync(uint256 _balance) external onlyOwner {
        require(_balance > 0);
        iKASReserve = _balance;
    }

    receive() external payable {}
}