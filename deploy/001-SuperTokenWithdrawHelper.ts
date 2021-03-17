import { utils } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const GAS_AMOUNT = utils.parseEther("0.01");

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  console.log("deployer: ", deployer);

  await deploy("SuperTokenWithdrawHelper", {
    from: deployer,
    args: [GAS_AMOUNT],
    log: true,
    deterministicDeployment: false,
  });
};
export default func;
