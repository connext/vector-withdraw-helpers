import { constants } from "ethers";
import { assert, contract, web3 } from "hardhat";
import { SuperTokenWithdrawHelper as TSuperTokenWithdrawHelper } from "../typechain";

const { web3tx, toWad, toBN } = require("@decentral.ee/web3-helpers");
const { expectRevert } = require("@openzeppelin/test-helpers");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");
// @ts-ignore
const SuperTokenWithdrawHelper = artifacts.require("SuperTokenWithdrawHelper");

const GAS_AMOUNT = "1" + "0".repeat(16);

contract("SuperTokenWithdrawHelper", (accounts) => {
  const errorHandler = (err: any) => {
    if (err) throw err;
  };

  accounts = accounts.slice(0, 4);
  const [admin, alice] = accounts;

  let sf: any;
  let daix: any;
  let adminSf: any;
  let dai: any;
  let fDAIMintable: any;
  let withdrawHelper: TSuperTokenWithdrawHelper;

  before(async function () {
    await deployFramework(errorHandler, {
      // @ts-ignore
      web3,
      from: admin,
    });
  });

  beforeEach(async function () {
    await deployTestToken(errorHandler, [":", "fDAI"], {
      // @ts-ignore
      web3,
      from: admin,
    });
    await deploySuperToken(errorHandler, [":", "fDAI"], {
      // @ts-ignore
      web3,
      from: admin,
    });

    sf = new SuperfluidSDK.Framework({
      // @ts-ignore
      web3,
      version: "test",
      tokens: ["fDAI"],
    });
    await sf.initialize();

    daix = sf.tokens.fDAIx;
    dai = sf.tokens.fDAI;

    // Create user objects
    adminSf = sf.user({ address: admin, token: daix.address });

    fDAIMintable = await sf.contracts.TestToken.at(dai.address);
    await fDAIMintable.mint(admin, "100" + "0".repeat(18));

    withdrawHelper = await SuperTokenWithdrawHelper.new(GAS_AMOUNT);
    assert.exists(withdrawHelper.address);
  });

  it("Happy case: upgrades token and sends gas money", async () => {
    const amount = "100" + "0".repeat(18);
    await fDAIMintable.mint(withdrawHelper.address, amount);
    const balance = await fDAIMintable.balanceOf(withdrawHelper.address);
    assert.equal(balance, amount);

    await web3.eth.sendTransaction({
      to: withdrawHelper.address,
      value: amount,
      from: admin,
    });
    const ethBalance = await web3.eth.getBalance(withdrawHelper.address);
    assert.equal(ethBalance, amount);

    const callData = await withdrawHelper.getCallData({
      amount,
      superToken: daix.address,
      to: alice,
      underlying: fDAIMintable.address,
    });
    assert.exists(callData);

    const superBalancePre = await daix.balanceOf(alice);
    const gasBalancePre = await web3.eth.getBalance(alice);
    assert.equal(superBalancePre, "0");

    await withdrawHelper.execute(
      {
        amount,
        assetId: constants.AddressZero,
        callData,
        callTo: constants.AddressZero,
        channelAddress: constants.AddressZero,
        nonce: 1,
        recipient: constants.AddressZero,
      },
      amount
    );

    const superBalance = await daix.balanceOf(alice);
    const gasBalance = await web3.eth.getBalance(alice);

    assert.equal(superBalance, amount);
    assert.equal(
      gasBalance,
      web3.utils.toBN(gasBalancePre).add(web3.utils.toBN(GAS_AMOUNT)).toString()
    );
  });
});
