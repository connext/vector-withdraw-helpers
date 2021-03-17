// SPDX-License-Identifier: UNLICENSED
pragma solidity >= 0.7.0;
pragma experimental ABIEncoderV2;

import "../common/WithdrawHelper.sol";
import { ISuperToken } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperToken.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SuperTokenWithdrawHelper is WithdrawHelper {
  mapping (address => bool) public gasTokenFundedAddress;
  uint immutable GAS_AMOUNT;

  event Received(address, uint);

  constructor (uint _gasAmount) {
    GAS_AMOUNT = _gasAmount;
  }

  struct SuperTokenUpgradeData {
    address superToken;
    address underlying;
    uint amount;
    address to;
  }

  function getCallData(
    SuperTokenUpgradeData calldata upgradeData
  ) public pure returns (bytes memory) {
    return abi.encode(upgradeData);
  }

  // call upgradeTo function on supertoken
  // assumes underlying tokens have already been sent to this contract from withdrawal
  function execute(WithdrawData calldata wd, uint256 actualAmount) override external {
    SuperTokenUpgradeData memory upgradeData = abi.decode(wd.callData, (SuperTokenUpgradeData));

    // stops random people from stealing our gas money without converting any tokens
    require(upgradeData.amount > 0, "SuperTokenWithdrawHelper: Must upgrade some amount of tokens");

    ISuperToken superToken = ISuperToken(upgradeData.superToken);
    IERC20 underlying = IERC20(upgradeData.underlying);

    underlying.approve(upgradeData.superToken, upgradeData.amount);
    superToken.upgradeTo(upgradeData.to, upgradeData.amount, "");

    // if we have gasToken available on this contract, send them
    // make sure we have not already sent
    // make sure recipient is actually poor
    if (address(this).balance >= GAS_AMOUNT && !gasTokenFundedAddress[upgradeData.to] && upgradeData.to.balance < GAS_AMOUNT) {
      gasTokenFundedAddress[upgradeData.to] = true;
      payable(address(upgradeData.to)).transfer(GAS_AMOUNT);
    }
  }

  
  receive() external payable {
    emit Received(msg.sender, msg.value);
  }
}

