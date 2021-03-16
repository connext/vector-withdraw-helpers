const { web3tx, toWad, toBN } = require("@decentral.ee/web3-helpers");
const { expectRevert } = require("@openzeppelin/test-helpers");
const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
const SuperfluidSDK = require("@superfluid-finance/js-sdk");

// @ts-ignore
contract("LotterySuperApp", (accounts: any) => {
  const errorHandler = (err: any) => {
    if (err) throw err;
  };

  accounts = accounts.slice(0, 4);
  const [admin] = accounts;

  let sf: any;
  let dai: any;


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
  });

  it("Happy case", async () => {});
});
