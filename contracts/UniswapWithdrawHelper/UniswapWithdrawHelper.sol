// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2;

import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IERC20.sol';

import "../common/WithdrawHelper.sol";

contract UniswapWithdrawHelper is WithdrawHelper {
  event Swap (
    address tokenA,
    address tokenB,
    uint amountIn,
    uint amountOutMin,
    address to,
    address router,
    uint[] amounts
  );

  struct SwapData {
    uint amountIn;
    uint amountOutMin;
    address tokenA;
    address tokenB;
    address[] path;
    address to;
    address router;
  }

  function getCallData(
    SwapData calldata swapData
  ) public pure returns (bytes memory) {
    return abi.encode(swapData);
  }

  function execute(WithdrawData calldata wd, uint256 actualAmount) override external {
    SwapData memory swapData = abi.decode(wd.callData, (SwapData));

    require(swapData.amountIn <= actualAmount, "UniswapWithdrawHelper: amountIn is not <= actualAmount");
    require(swapData.tokenA != swapData.tokenB, "UniswapWithdrawHelper: tokens cannot be the same");

    if (swapData.tokenA != address(0)) {
      require(IERC20(swapData.tokenA).approve(swapData.router, swapData.amountIn), "UniswapWithdrawHelper: tokenA approve failed.");
    }

    uint[] memory amounts;
    if (swapData.tokenA == address(0)) {
      amounts = IUniswapV2Router02(swapData.router).swapExactETHForTokens(
        swapData.amountOutMin, 
        swapData.path, 
        swapData.to, 
        block.timestamp
      );
    } else if (swapData.tokenB == address(0)) {
      amounts = IUniswapV2Router02(swapData.router).swapExactTokensForETH(
        swapData.amountIn,
        swapData.amountOutMin, 
        swapData.path, 
        swapData.to, 
        block.timestamp
      );
    } else {
      amounts = IUniswapV2Router02(swapData.router).swapExactTokensForTokens(
        swapData.amountIn,
        swapData.amountOutMin, 
        swapData.path, 
        swapData.to, 
        block.timestamp
      );
    }

    emit Swap(
      swapData.tokenA, 
      swapData.tokenB, 
      swapData.amountIn, 
      swapData.amountOutMin, 
      swapData.to, 
      swapData.router, 
      amounts
    );
  }
}

