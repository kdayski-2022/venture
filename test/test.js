// const { waffleJest } = require('@ethereum-waffle/jest');
// const { utils } = require('ethers');
const { ethers } = require('hardhat');
const hre = require('hardhat');
const checkVentureMethodError = require('./venture');

let owner = process.env.OWNER;
let verbose = true;

// expect.extend(waffleJest);

const log = (...args) => {
  // if (verbose) {
    // console.log(...args);
  // }
};

let usdc,
  xdai,
  venture,
  simpleUserAccount,
  superUserAccount,
  successUserAccount,
  simpleUser,
  superUser,
  successUser,
  params,
  vSettings,
  usdcAddress,
  ventureAddress,
  ERC20,
  projectToken,
  xdaiAddress,
  contributeId;

beforeEach(async () => {
  let accounts = await ethers.getSigners();
  owner = accounts[0].address;
  simpleUserAccount = accounts[1];
  superUserAccount = accounts[2];
  successUserAccount = accounts[3];
  simpleUser = accounts[1].address;
  superUser = accounts[2].address;
  successUser = accounts[3].address;
  log('owner: ', owner);
  log('simpleUser: ', simpleUser);
  log('superUser: ', superUser);

  params = {
    contributeAmount: 1000,
    capAmount: 1000,
    distributeProjectTokenAmount: 1000,
    baseProjectTokenPrice: 100,
    currentProjectTokenPrice: 200,

    calculatePercentageTotal: 100,
    calculatePercentage: 10,
    successFeeAmountTokenForType2: 100
  };
  vSettings = {
    limitAmounts: [
      10, // _minAmountForUser,
      1000, // _maxAmountForUser,
      100, // _minAmountForPrivilegedUser,
      1000, // _maxAmountForPrivilegedUser,
    ],
    commissions: [
      500, // _commission 5%,
      100, // _weeziComission 1%,
      1000, // _commissionPrivileged 10%,
      500, // _weeziComissionPrivileged 5%,
    ],
    wallets: [
      successUser, // _walletAddressForSuccessFundraising,
      owner, // walletAddressForServiceFundraising,
      owner, // walletAddressForDaoFundraising,
      owner, //rewardApp
    ],
    settings: [
      10, // _maxNumbersOfContributers
      2, //distributionFeeType
      params.baseProjectTokenPrice, //baseTokenPrice
    ],
  };
});

describe('VENTURE', () => {
  it('PREPARING', async () => {
    ERC20 = await hre.ethers.getContractFactory('ERC20');
    usdc = await ERC20.deploy('USDC', 'USDC', 18);
    usdc = await usdc.deployed();
    usdcAddress = usdc.address;
    log(`Deployed ERC20 USDC ${usdcAddress}`);

    xdai = await ERC20.deploy('XDAI', 'XDAI', 18);
    xdai = await xdai.deployed();
    xdaiAddress = xdai.address;
    log(`Deployed ERC20 XDAI ${xdaiAddress}`);
  });

  it('SEND TOKENS', async () => {
    await xdai.transfer(simpleUser, params.contributeAmount);
    await usdc.transfer(superUser, params.contributeAmount);

    log('Deploying Venture...');
    const Venture = await hre.ethers.getContractFactory('VentureRemix');
    venture = await Venture.deploy();
    venture = await venture.deployed();
    ventureAddress = venture.address;
    log(`Venture: ${ventureAddress}`);
  });

  it('INITIALIZE', async () => {
    try {
      const ventureInitializeTx = await venture.initialize(
        vSettings.limitAmounts,
        vSettings.commissions,
        vSettings.wallets,
        vSettings.settings
      );
      await ventureInitializeTx.wait();
    } catch(error) {
      checkVentureMethodError("initialize", error)
    }
  });

  it('ADD ACCEPTABLE TOKEN', async () => {
    try {
      const ventureAddAcceptableTokenTx = await venture.addAcceptableToken(
        usdcAddress
      );
      await ventureAddAcceptableTokenTx.wait();
    } catch(error) {
      checkVentureMethodError('addAcceptableToken', error)
    }
  });

  it('REMOVE ACCEPTABLE TOKEN', async () => {
    try {
      const ventureRemoveAcceptableTokenTx = await venture.removeAcceptableToken(
        usdcAddress
      );
      await ventureRemoveAcceptableTokenTx.wait();
    } catch(error) {
      checkVentureMethodError('removeAcceptableToken', error)
    }
    try {
      const ventureAddAcceptableTokenTx = await venture.addAcceptableToken(
        usdcAddress
      );
      await ventureAddAcceptableTokenTx.wait();
    } catch(error) {
      checkVentureMethodError('addAcceptableToken', error)
    }
  });

  it('ADD PRIVELEGED USERS', async () => {
    try {
      const ventureAddPrivelegedUsersTx = await venture.addPrivelegedUsers([
        superUser,
      ]);
      await ventureAddPrivelegedUsersTx.wait();
    } catch(error) {
      checkVentureMethodError('addPrivelegedUsers', error)
    }
  });

  it('REMOVE PRIVELEGED USERS', async () => {
    try {
      const ventureRemovePrivelegedUsersTx = await venture.removePrivelegedUsers([
        superUser,
      ]);
      await ventureRemovePrivelegedUsersTx.wait();
    } catch(error) {
      checkVentureMethodError('removePrivelegedUsers', error)
    }
    try {
      const ventureAddPrivelegedUsersTx = await venture.addPrivelegedUsers([
        superUser,
      ]);
      await ventureAddPrivelegedUsersTx.wait();
    } catch(error) {
      checkVentureMethodError('addPrivelegedUsers', error)
    }
  });

  it('APPROVE SOME TOKENS TO VENTURE CONTRACT', async () => {
    const erc20ApproveTx = await usdc
      .connect(superUserAccount)
      .approve(ventureAddress, params.contributeAmount);
    await erc20ApproveTx.wait();
    const erc20ApproveTx2 = await xdai
      .connect(simpleUserAccount)
      .approve(ventureAddress, params.contributeAmount);
    await erc20ApproveTx2.wait();
  });

  it('CONTRIBUTE', async () => {
    try {
      const ventureContributeTx = await venture
        .connect(superUserAccount)
        .contribute(
          usdcAddress, 
          params.contributeAmount);
      await ventureContributeTx.wait();
    } catch(error) {
      checkVentureMethodError("contribute", error)
    }
  });

  it('GET CONTRIBUTES', async () => {
    try {
      const contributes = await venture.getContributes();
      expect(Array.isArray(contributes)).toBe(true);
      expect(contributes.length).toBeGreaterThan(0)
      contributeId = 0
    } catch(error) {
      checkVentureMethodError('getContributes', error)
    }
  });

  it('STOP STOPFUNDRAISING', async () => {
    try {
      const ventureStopFundraisingTx = await venture.stopFundraising();
      await ventureStopFundraisingTx.wait();
    } catch(error) {
      checkVentureMethodError('stopFundraising', error)
    }
  });

  it('PROJECT TOKEN', async () => {
    projectToken = await ERC20.deploy('PROJECT', 'PROJECT', 18);
    projectToken = await projectToken.deployed();
    const projectTokenAddress = projectToken.address;
    log(`Deploed ERC20 PROJECT ${projectTokenAddress}`);
    try {
      const setProjectTokenTx = await venture.setProjectToken(
        projectTokenAddress
      );
      await setProjectTokenTx.wait();
    } catch(error) {
      checkVentureMethodError('setProjectToken', error)
    }
    try {
      await venture.calculateNeedProjectTokens();
    } catch(error) {
      checkVentureMethodError('calculateNeedProjectTokens', error)
    }
    const projectTokenApproveTx = await projectToken.approve(
      ventureAddress,
      params.distributeProjectTokenAmount * 10
    );
    await projectTokenApproveTx.wait();
  });

  it('CALCULATE SUCCESS FEE AMOUNT TOKEN FOR TYPE 2', async () => {
    if (vSettings.settings[1] == 2) {
      try {
        await venture.calculateSuccessFeeAmountTokenForType2(params.successFeeAmountTokenForType2);
      } catch(error) {
        checkVentureMethodError('calculateSuccessFeeAmountTokenForType2', error)
      }
    }
  });

  it('GET CONTRIBUTE LENGTH', async () => {
    try {
      await venture.getContributeLength();
    } catch(error) {
      checkVentureMethodError('getContributeLength', error)
    }
  });

  it('GET CONTRIBUTE', async () => {
    try {
      await venture.getContribute(contributeId);
    } catch(error) {
      checkVentureMethodError('getContribute', error)
    }
  });

  it('FEE TYPE OF 2', async () => {
    if (vSettings.settings[1] == 2) {
      try {
        const setCapAmountTx = await venture.setCapAmount(params.capAmount);
        await setCapAmountTx.wait();
      } catch(error) {
        checkVentureMethodError('setCapAmount', error)
      }
      try {
        const setProjectTokenPriceTx = await venture.setProjectTokenPrice(
          params.currentProjectTokenPrice
        );
        await setProjectTokenPriceTx.wait();
      } catch(error) {
        checkVentureMethodError('setProjectTokenPrice', error)
      }
    }
  });

  it('CALCULATE PERCENTAGE', async () => {
    try {
      await venture.calculatePercentage(
        params.calculatePercentageTotal,
        params.calculatePercentage
      );
    } catch(error) {
      checkVentureMethodError('calculatePercentage', error)
    }
  });

  it('DESTRIBUTE TOKENS', async () => {
    try {
      const distributeProjectTokenTx = await venture.distributeProjectToken(
        params.distributeProjectTokenAmount,
        0
      );
      await distributeProjectTokenTx.wait();
    } catch(error) {
      checkVentureMethodError('distributeProjectToken', error)
    }
  });
});
