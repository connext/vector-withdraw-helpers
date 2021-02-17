import { ethers, deployments, getNamedAccounts } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { UniswapWithdrawHelper } from "../typechain";

const setupTest = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }, options) => {
    await deployments.fixture(); // ensure you start from a fresh deployments
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    console.log("deployer: ", deployer);
    const factory = await ethers.getContractFactory("UniswapV2Router02");
    const tx = await factory.deploy();
    console.log("tx: ", tx);
    const receipt = await tx.deployTransaction.wait();
    console.log("receipt: ", receipt);
  }
);

chai.use(solidity);
const { expect } = chai;

describe("Counter", () => {
  beforeEach(async () => {
    await setupTest();
  });

  it("should count up", async () => {
    const uniswapWithdrawHelper: UniswapWithdrawHelper = await (ethers as any).getContract(
      "UniswapWithdrawHelper"
    );
    const calldata = await uniswapWithdrawHelper.getCallData();
    console.log("calldata: ", calldata);
  });
});
