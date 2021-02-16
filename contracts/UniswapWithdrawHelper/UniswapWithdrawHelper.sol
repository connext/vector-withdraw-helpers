// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0;
pragma experimental ABIEncoderV2;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-core/contracts/interfaces/IERC20.sol';

import "./WithdrawHelper.sol";

contract UniswapWithdrawHelper is WithdrawHelper {
  event Swap (
    address pair,
    address token0,
    address token1,
    uint amount0Out,
    uint amount1Out,
    address to,
    bytes data,
    uint256 actualAmount
  );

  struct SwapData {
    address pair;
    address token0;
    address token1;
    uint amount0Out;
    uint amount1Out;
    address to;
    bytes data;
  }

  function execute(WithdrawData calldata wd, uint256 actualAmount) override external {
    SwapData memory swapData = abi.decode(wd.callData, (SwapData));

    if (swapData.token0 != address(0)) {
      IERC20(swapData.token0).approve(swapData.pair, swapData.amount0Out);
    }

    if (swapData.token1 != address(0)) {
      IERC20(swapData.token1).approve(swapData.pair, swapData.amount1Out);
    }

    IUniswapV2Pair(swapData.pair).swap(swapData.amount0Out, swapData.amount1Out, swapData.to, swapData.data);
    emit Swap(
      swapData.pair, 
      swapData.token0, 
      swapData.token1, 
      swapData.amount0Out, 
      swapData.amount1Out, 
      swapData.to, 
      swapData.data, actualAmount
    );
  }
}

