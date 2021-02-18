import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import { HardhatUserConfig } from "hardhat/types";

import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-deploy-ethers";
import "hardhat-deploy";

const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const PRIVATE_KEY =
  process.env.PRIVATE_KEY! ||
  "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3"; // well known private key
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

let mnemonic = process.env.MNEMONIC;
if (!mnemonic) {
  // FOR DEV ONLY, SET IT IN .env files if you want to keep it private
  // (IT IS IMPORTANT TO HAVE A NON RANDOM MNEMONIC SO THAT SCRIPTS CAN ACT ON THE SAME ACCOUNTS)
  mnemonic =
    "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";
}
const accounts = {
  mnemonic,
};

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      { version: "0.7.3", settings: {} },
      { version: "0.6.6", settings: {} },
      { version: "0.5.16", settings: {} },
    ],
  },
  namedAccounts: {
    deployer: 0,
    proxyOwner: 1,
    admin: "0x5B9d721f482E60efA99e555Cb59c7DBF4Df15Dc7",
  },
  networks: {
    hardhat: {
      accounts,
    },
    localhost: {
      url: "http://localhost:8545",
      accounts,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [PRIVATE_KEY],
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      accounts: [PRIVATE_KEY],
    },
    xdai: {
      url: "https://rpc.xdaichain.com/",
      accounts: [PRIVATE_KEY],
    },
    matic: {
      url: "https://rpc-mainnet.matic.network",
      accounts: [PRIVATE_KEY],
    },
    coverage: {
      url: "http://127.0.0.1:8555", // Coverage launches its own ganache-cli client
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
