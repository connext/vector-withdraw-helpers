import { ethers, deployments, getNamedAccounts } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import {
  UniswapWithdrawHelper,
  IUniswapV2Router02,
  IUniswapV2Factory,
  IERC20,
} from "../typechain";
import { constants, Contract, Signer } from "ethers";
import { parseEther } from "ethers/lib/utils";

import ERC20 from "@uniswap/v2-core/build/ERC20.json";
import UniswapV2Factory from "@uniswap/v2-core/build/UniswapV2Factory.json";
import UniswapV2Router from "@uniswap/v2-periphery/build/UniswapV2Router02.json";

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
    const { deployer } = await getNamedAccounts();
    const [signer] = await ethers.getSigners();
    const weth = await deployContract<IERC20>(
      ERC20,
      [parseEther("100000000")],
      signer
    );

    const uniFactory = await deployContract<IUniswapV2Factory>(
      UniswapV2Factory,
      [constants.AddressZero],
      signer
    );

    const uniRouter = await deployContract<IUniswapV2Router02>(
      UniswapV2Router,
      [uniFactory.address, weth.address],
      signer
    );

    const tokenA = await deployContract<IERC20>(
      ERC20,
      [parseEther("100000000")],
      signer
    );

    const tokenB = await deployContract<IERC20>(
      ERC20,
      [parseEther("100000000")],
      signer
    );

    await tokenA.approve(uniRouter.address, constants.MaxUint256);
    await tokenB.approve(uniRouter.address, constants.MaxUint256);

    await uniFactory.createPair(tokenA.address, tokenB.address);
    console.log("PAIR");
    await uniRouter.addLiquidity(
      tokenA.address,
      tokenB.address,
      parseEther("5000000"),
      parseEther("1000000"),
      1,
      1,
      deployer,
      Date.now() + 15_000 // deadline
    );

    // await uniRouter.addLiquidityETH(
    //   tokenA.address,
    //   parseEther("5000000"),
    //   1,
    //   1,
    //   deployer,
    //   Date.now() + 15_000, // deadline
    //   { value: parseEther("1000000") }
    // );

    return { uniRouter, uniFactory, weth, tokenA, tokenB, deployer };
  }
);

chai.use(solidity);
const { expect } = chai;

describe("UniswapWithdrawHelper", () => {
  let uniRouter: IUniswapV2Router02;
  let deployer: string;
  let tokenA: IERC20;
  let tokenB: IERC20;

  beforeEach(async () => {
    ({
      uniRouter,
      deployer,
      tokenA,
      tokenB,
      deployer,
    } = await setupTest());
  });

  it("should swap tokens", async () => {
    const uniswapWithdrawHelper: UniswapWithdrawHelper = await (ethers as any).getContract(
      "UniswapWithdrawHelper"
    );

    expect(uniswapWithdrawHelper.address).to.be.ok;

    const callData = await uniswapWithdrawHelper.getCallData({
      amountIn: parseEther("500000"),
      amountOutMin: 1,
      router: uniRouter.address,
      to: deployer,
      tokenA: tokenA.address,
      tokenB: tokenB.address,
      path: [tokenA.address, tokenB.address],
    });
    console.log("callData: ", callData);
    expect(callData).to.be.ok;

    await tokenA.transfer(uniswapWithdrawHelper.address, parseEther("500000"));

    const tx = await uniswapWithdrawHelper.execute(
      {
        amount: 0,
        assetId: tokenA.address,
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
  it("should swap eth for tokens");
  it("should swap tokens for eth");
  it("should not swap if amountIn is > actual amount");
  it("should not swap if token addresses are the same");
});
