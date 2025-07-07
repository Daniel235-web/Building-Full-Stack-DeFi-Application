//SPDX-License-Indentifier: MIT
pragma solidity ^0.8.0;
import "./interfaces/IPairFactory.sol";
import "./interfaces/IAMMRouter.sol";
import "./libraries/Helper.sol";
import "./interfaces/ITokenPair.sol";


contract AMMRouter  is IAMMRouter {
    address public immutable factory;
    bytes32 private initCodeHash;
    constructor(address _factory) {
        factory = _factory;
        initCodeHash  = IPairFactory(factory).INIT_CODE_PAIR_HASH();

    }

    modifier ensure (uint256 deadline) {
        require (deadline >= block.timestamp, "EXPIRED");
        _;

    }
    //Fetch reserves and pair address of a pair while respecting the token  order
    function getReserves(address tokenA, address tokenB)
    public
    view 
    returns(uint256 reserveA, uint256 reserveB, address pair){
        (address _tokenA, )  = Helper.sortTokens(tokenA, tokenB);
        pair = Helper.pairFor(factory, tokenA, tokenB, initCodeHash);
        (uint256 _reserveA, uint256 _reserveB, ) = ITokenPair(pair).getReserves();
        (reserveA, reserveB) = tokenA ==_tokenA ? (_reserveA, _reserveB) : (_reserveB, _reserveA);
    }
//perform getAmount calculations along the pair in the path
function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts){
    require (path.length >=2, "INVALID_PATH");
    amounts = new uint256[](path.length);
    amounts[0] = amountIn;
    for (uint256 i; i < path.length -1 ; i++) {
        (uint256 reserveIn, uint256 reserveOut, ) = getReserves(
            path[i],
            path[i + 1]
        );
        amounts[i + 1 ] = Helper.getAmountOut(amounts[i], reserveIn, reserveOut);
    }
}
//perform getAmountIn calcutlations  from the pair in the end of the path
function getAmountsIn(uint256 amountOut, address[] memory path) public view returns(uint256[] memory amounts){
    require(path.length >= 2 , "INVALID_PATH");
    amounts = new uint256[](path.length);
    amounts[amounts.length - 1] =  amountOut;
    for (uint256 i = path.length - 1; i > 0; i--) {
        (uint256 reserveIn, uint256 reserveOut, ) = getReserves(path[i - 1], path[i]);
        amounts[i - 1] = Helper.getAmountIn(amounts[i], reserveIn, reserveOut);

    }
}

}