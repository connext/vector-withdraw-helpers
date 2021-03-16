import ERC20 from "@uniswap/v2-core/build/ERC20.json";
import SuperToken from "@superfluid-finance/ethereum-contracts/build/contracts/SuperToken.json";
import Superfluid from "@superfluid-finance/ethereum-contracts/build/contracts/Superfluid.json";
import SuperTokenFactory from "@superfluid-finance/ethereum-contracts/build/contracts/SuperTokenFactory.json";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { constants, Contract, Signer } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { deployments, ethers, getNamedAccounts } from "hardhat";

import {
  IERC20,
  SuperTokenWithdrawHelper,
  ISuperToken,
  ISuperfluid,
  ISuperTokenFactory,
} from "../typechain";

async function deployContract<T = Contract>(
  artifacts: any,
  args: any[] = [],
  signer: Signer
): Promise<T> {
  const factory = new ethers.ContractFactory(
    artifacts.abi,
    artifacts.bytecode,
    signer
  );
  const contract = await factory.deploy(...args);
  return (contract.deployed() as unknown) as T;
}

const setupTest = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    await deployments.fixture(); // ensure you start from a fresh deployments

    const { deployer, admin } = await getNamedAccounts();
    const [signer] = await ethers.getSigners();

    const superfluid = await deployContract<ISuperfluid>(
      Superfluid,
      [false, true],
      signer
    );

    console.log(superfluid.address);

    // const superTokenFactory = await deployContract<ISuperTokenFactory>(
    //   SuperTokenFactory,
    //   [superfluid.address],
    //   signer
    // );
    // console.log(superTokenFactory.address);

    // const intializeTx = await superTokenFactory.createSuperTokenLogic(
    //   superfluid.address
    // );

    // const receipt = await intializeTx.wait();

    // console.log("receipt: ", receipt);
    // console.log("value", intializeTx);
    // expect(receipt).to.be.ok;

    // const value = await superTokenFactory.getSuperTokenLogic();
    // console.log(value);

    const token = await deployContract<IERC20>(
      ERC20,
      [parseEther("100000000")],
      signer
    );
    console.log(token.address);

    const superToken = await deployContract<ISuperToken>(
      SuperToken,
      [superfluid.address],
      signer
    );
    console.log(superToken.address);

    const intializeTx = await superToken.initialize(token.address, 18, "", "");

    const initializeReceipt = intializeTx.wait();

    console.log("receipt: ", initializeReceipt);
    expect(initializeReceipt).to.be.ok;

    return { superToken, token, deployer, admin };
  }
);

chai.use(solidity);
const { expect } = chai;

describe.only("SuperTokenWithdrawHelper", () => {
  let superToken: ISuperToken;
  let deployer: string;
  let token: IERC20;

  beforeEach(async () => {
    ({ superToken, token, deployer } = await setupTest());
  });

  it("should upgrade token to super token", async () => {
    const superTokenWithdrawHelper: SuperTokenWithdrawHelper = await (ethers as any).getContract(
      "SuperTokenWithdrawHelper"
    );
    console.log(superToken.address, token.address, deployer);

    expect(superTokenWithdrawHelper.address).to.be.ok;

    const callData = await superTokenWithdrawHelper.getCallData({
      superToken: superToken.address,
      underlying: token.address,
      amount: parseEther("1"),
      to: deployer,
      gasAmount: parseEther("0.001"),
    });
    console.log("callData: ", callData);
    expect(callData).to.be.ok;

    // await accounts.sendTransaction(superTokenWithdrawHelper.address, parseEther("500000"));

    const tx = await superTokenWithdrawHelper.execute(
      {
        amount: 0,
        assetId: token.address,
        callData,
        callTo: constants.AddressZero,
        channelAddress: constants.AddressZero,
        nonce: 1,
        recipient: constants.AddressZero,
      },
      parseEther("500000")
    );
    const receipt = await tx.wait();
    console.log("receipt: ", receipt);
    expect(receipt).to.be.ok;
  });
});
