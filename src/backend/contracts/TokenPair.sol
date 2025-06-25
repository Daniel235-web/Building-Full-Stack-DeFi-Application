// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./interfaces/ITokenPair.sol";
import "./interfaces/IPairFactory.sol";

contract TokenPair is ITokenPair, ERC20, ReentrancyGuard {
    bytes4 private constant SELECTOR = bytes4(keccak256(bytes("transfer(address, uint256)")));
    address public factory;
    address public tokenA;
    address public tokenB;
    uint256 public kLast;
    uint256 public constant  MINIMUM_LIQUIDITY = 10**3;

    uint256 private reserveA;
    uint256 private reserveB;
    uint256 private blockTimestampLast;

    function getReserves()public view returns(uint256 _reserveA, uint256 _reserveB, uint256 _blockTimestampLast){
        _reserveA = reserveA;
        _reserveB = reserveB;
        _blockTimestampLast = blockTimestampLast;

    }
    function _safeTransfer(address token, address to, uint256 value) private { (bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, to, value));
    require (success && (data.length == 0 || abi.decode(data, (bool))) , "TRANSFER_FAILED");
    }
    constructor() ERC20("DEX Token Pair", "DEX-TP") {
        factory = msg.sender;
    }
    function initialize(address _tokenA, address _tokenB) external {
        require(msg.sender == factory, "NOT_FACTORY");
        tokenA  = _tokenA;
        tokenB = _tokenB;


    }
    function _setReserves(uint256 balance0, uint256 balance1) private {
        reserveA = balance0;
        reserveB = balance1;
        blockTimestampLast = block.timestamp;
        emit Sync(reserveA, reserveB);
    }
// Mint reward for DEX Owner
    function _mintReward(uint256 _reserveA, uint256 _reserveB)
    private
    returns(bool hashReward)
    {
        address rewardTo = IPairFactory(factory).rewardTo();
        hashReward = rewardTo !=address(0);
        uint256 _kLast = kLast; //gas savings
        if (hashReward) {
            if (_kLast != 0) {
                uint256 rootK = Math.sqrt(_reserveA * _reserveB);
                uint256 rootKLast =  Math.sqrt(_kLast);
                if (rootK  > rootKLast ) {
                    uint256 liquidity = (totalSupply() * (rootK - rootKLast)) / (rootKLast + rootK * 9);
                    if(liquidity > 0) _mint(rewardTo, liquidity);
                }

            }
        }
        else if (_kLast != 0) {
            kLast = 0;
        }

    }
    function mint(address to ) external nonReentrant returns (uint256 liquidity)
}