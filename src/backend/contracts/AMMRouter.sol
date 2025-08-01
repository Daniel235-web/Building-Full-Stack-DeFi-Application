// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./interfaces/IPairFactory.sol";
import "./interfaces/IAMMRouter.sol";
import "./libraries/Helper.sol";
import "./interfaces/ITokenPair.sol";

contract AMMRouter is IAMMRouter {
    address public immutable factory;
    bytes32 private initCodeHash;

    constructor(address _factory) {
        factory = _factory;
        initCodeHash = IPairFactory(factory).INIT_CODE_PAIR_HASH();
    }

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "EXPIRED");
        _;
    }

    //Fetch reserves and pair address of a pair while respecting the token  order
    function getReserves(
        address tokenA,
        address tokenB
    ) public view returns (uint256 reserveA, uint256 reserveB, address pair) {
        (address _tokenA, ) = Helper.sortTokens(tokenA, tokenB);
        pair = Helper.pairFor(factory, tokenA, tokenB, initCodeHash);
        (uint256 _reserveA, uint256 _reserveB, ) = ITokenPair(pair)
            .getReserves();
        (reserveA, reserveB) = tokenA == _tokenA
            ? (_reserveA, _reserveB)
            : (_reserveB, _reserveA);
    }

    //perform getAmount calculations along the pair in the path
    function getAmountsOut(
        uint256 amountIn,
        address[] memory path
    ) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut, ) = getReserves(
                path[i],
                path[i + 1]
            );
            amounts[i + 1] = Helper.getAmountOut(
                amounts[i],
                reserveIn,
                reserveOut
            );
        }
    }

    //perform getAmountIn calcutlations  from the pair in the end of the path
    function getAmountsIn(
        uint256 amountOut,
        address[] memory path
    ) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "INVALID_PATH");
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint256 i = path.length - 1; i > 0; i--) {
            (uint256 reserveIn, uint256 reserveOut, ) = getReserves(
                path[i - 1],
                path[i]
            );
            amounts[i - 1] = Helper.getAmountIn(
                amounts[i],
                reserveIn,
                reserveOut
            );
        }
    }

    //ADD Liquidity
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        ensure(deadline)
        returns (uint256 amountA, uint256 amountB, uint256 liquidity)
    {
        //create a pair if the token does not exist
        if (IPairFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            IPairFactory(factory).createPair(tokenA, tokenB);
        }
        //step 2 get reserves of the token pair
        (uint256 reserveA, uint256 reserveB, address pair) = getReserves(
            tokenA,
            tokenB
        );
        //step 3: calculate the actual amounts of the token for lquidity
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            //Liquidity alreay exists
            uint256 amountBOptimal = Helper.quote(
                amountADesired,
                reserveA,
                reserveB
            );
            if (amountBOptimal <= amountBDesired) {
                require(
                    amountBOptimal >= amountBMin,
                    "INSUFFICIENT_tokenB_AMOUNT"
                );
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = Helper.quote(
                    amountBDesired,
                    reserveB,
                    reserveA
                );
                assert(amountAOptimal <= amountADesired);
                require(
                    amountAOptimal >= amountAMin,
                    "INSUFFICIENT_tokenA_AMOUNT"
                );
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
        //step 4: transfer tokens from user to pair;
        Helper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        Helper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        //step 5 mint and send back LP tokens to users
        liquidity = ITokenPair(pair).mint(to);
    }

    //Remove Liquidity
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) public ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        //step 1: transfer Lp tokens to pair
        address pair = Helper.pairFor(factory, tokenA, tokenB, initCodeHash);
        Helper.safeTransferFrom(pair, msg.sender, pair, liquidity);
        //Burn Lp tokens and transfer removed liquidity back to user
        (uint256 amount0, uint256 amount1) = ITokenPair(pair).burn(to);
        //step 3 : verify the amounts of liquidity are sufficient
        (address _tokenA, ) = Helper.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == _tokenA
            ? (amount0, amount1)
            : (amount1, amount0);
        require(amountA >= amountAMin, "INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "INSUFFICIENT_B_AMOUNT");
    }

    //Internal function  for swapping tokens along the specified path in a loop
    //requires the initial amount  to have already been sent  to the first pair

    function _swap(
        uint256[] memory amounts,
        address[] memory path,
        address _to
    ) internal virtual {
        for (uint256 i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address tokenA, ) = Helper.sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amountAOut, uint256 amountBOut) = input == tokenA
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address to = i < path.length - 2
                ? Helper.pairFor(factory, output, path[i + 2], initCodeHash)
                : _to;
            ITokenPair(Helper.pairFor(factory, input, output, initCodeHash))
                .swap(amountAOut, amountBOut, to);
        }
    }

    //swapping by specifying  spending amount
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        //step 1:calculate the amount to be swapped along the path
        amounts = getAmountsOut(amountIn, path);
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "INSUFFICIENT_OUTPUT_AMOUNT"
        );
        //STEP 2: transfer the first pair in the path
        Helper.safeTransferFrom(
            path[0],
            msg.sender,
            Helper.pairFor(factory, path[0], path[1], initCodeHash),
            amounts[0]
        );
        //step 3: swap through the path  for each pair with the amounts
        _swap(amounts, path, to);
    }

    //swapping by specicifying the receiving amount
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external ensure(deadline) returns (uint256[] memory amounts) {
        //step 1 : calculate the input amounts from the end of the path
        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "EXCESSIVE_INPUT_AMOUNT");

        //step 2:  transfer to the first pair in the path
        Helper.safeTransferFrom(
            path[0],
            msg.sender,
            Helper.pairFor(factory, path[0], path[1], initCodeHash),
            amounts[0]
        );
        _swap(amounts, path, to);
    }
}
