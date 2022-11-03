const { waffleJest } = require('@ethereum-waffle/jest');
// const { utils } = require('ethers');
const { ethers } = require('hardhat');
const hre = require('hardhat');

let owner = process.env.OWNER;
let verbose = true;

expect.extend(waffleJest);

const log = (...args) => {
  if (verbose) {
    console.log(...args);
  }
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
  xdaiAddress;

beforeEach(async () => {
  let accounts = await ethers.getSigners();
  expect(accounts.length).toBeGreaterThanOrEqual(4);
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

describe('TEST', () => {
  it('PREPARING', async () => {
    ERC20 = await hre.ethers.getContractFactory('ERC20');
    usdc = await ERC20.deploy('USDC', 'USDC', 18);
    usdc = await usdc.deployed();
    usdcAddress = usdc.address;
    expect(usdcAddress).toBeProperAddress();
    log(`Deployed ERC20 USDC ${usdcAddress}`);

    xdai = await ERC20.deploy('XDAI', 'XDAI', 18);
    xdai = await xdai.deployed();
    xdaiAddress = xdai.address;
    expect(xdaiAddress).toBeProperAddress();
    log(`Deployed ERC20 XDAI ${xdaiAddress}`);
  });

  it('SEND TOKENS', async () => {
    await xdai.transfer(simpleUser, params.contributeAmount);
    await usdc.transfer(superUser, params.contributeAmount);
    expect(await usdc.balanceOf(superUser)).toEqBN(params.contributeAmount);
    console.log(`Balance ERC20 tokens ${await usdc.balanceOf(superUser)}`);

    log('Deploying Venture...');
    const Venture = await hre.ethers.getContractFactory('VentureRemix');
    venture = await Venture.deploy();
    venture = await venture.deployed();
    ventureAddress = venture.address;
    expect(ventureAddress).toBeProperAddress();
    log(`Venture: ${ventureAddress}`);
  });

  it('INITIALIZE', async () => {
    const ventureInitializeTx = await venture.initialize(
      vSettings.limitAmounts,
      vSettings.commissions,
      vSettings.wallets,
      vSettings.settings
    );
    await ventureInitializeTx.wait();
    expect(
      await venture.walletAddressForSuccessFundraising()
    ).toBeProperAddress();
    console.log(await venture.walletAddressForSuccessFundraising());
  });

  it('ADD ACCEPTABLE TOKEN', async () => {
    const ventureAddAcceptableTokenTx1 = await venture.addAcceptableToken(
      usdcAddress
    );
    await ventureAddAcceptableTokenTx1.wait();
    const ventureAddAcceptableTokenTx2 = await venture.addAcceptableToken(
      xdaiAddress
    );
    await ventureAddAcceptableTokenTx2.wait();
  });

  it('ADD PRIVELEGED USERS', async () => {
    const ventureAddPrivelegedUsersTx = await venture.addPrivelegedUsers([
      superUser,
    ]);
    await ventureAddPrivelegedUsersTx.wait();
  });

  it('APPROVE SOME TOKENS TO VENTURE CONTRACT', async () => {
    const erc20ApproveTx1 = await usdc
      .connect(superUserAccount)
      .approve(ventureAddress, params.contributeAmount);
    await erc20ApproveTx1.wait();
    console.log({ erc20ApproveTx1 });
    const erc20ApproveTx2 = await xdai
      .connect(simpleUserAccount)
      .approve(ventureAddress, params.contributeAmount);
    await erc20ApproveTx2.wait();
  });

  it('CONTRIBUTE', async () => {
    const ventureContributeTx1 = await venture
      .connect(superUserAccount)
      .contribute(usdcAddress, params.contributeAmount);
    await ventureContributeTx1.wait();
    const ventureContributeTx2 = await venture
      .connect(simpleUserAccount)
      .contribute(xdaiAddress, params.contributeAmount);
    await ventureContributeTx2.wait();
  });

  //! TODO

  it('CHECKS', async () => {
    expect(await usdc.balanceOf(ventureAddress)).toEqBN(
      params.contributeAmount
    );
    console.log(
      `Balance VENTURE USDC tokens ${await usdc.balanceOf(ventureAddress)}`
    );
    const contributes = await venture.getContributes();
    expect(Array.isArray(contributes)).toBe(true);
    expect(contributes.length).toBeGreaterThan(0);
    contributes.forEach((contribute, i) => {
      expect(Array.isArray(contribute)).toBe(true);
      expect(contribute.length).toBeGreaterThanOrEqual(8);
      expect(contribute[0]).toBeProperAddress();
      expect(contribute[1]).toBeProperAddress();
      expect(contribute[2]).toEqBN(params.contributeAmount);
      expect(contribute[3]).toEqBN(params.contributeAmount);
      expect(contribute[4]).toEqBN(0);
      expect(contribute[5]).toEqBN(0);
      expect(contribute[6]).toEqBN(0);
      expect(typeof contribute[7]).toBe('boolean');
      if (i === 0) expect(contribute[7]).toBe(true);
      if (i === 1) expect(contribute[7]).toBe(false);
    });
    console.log(`getContributes ${await venture.getContributes()}`);
  });

  it('STOP STOPFUNDRAISING', async () => {
    const ventureStopFundraisingTx = await venture.stopFundraising();
    await ventureStopFundraisingTx.wait();
    expect(await usdc.balanceOf(successUser)).toEqBN(params.contributeAmount);
    expect(await xdai.balanceOf(successUser)).toEqBN(params.contributeAmount);
    console.log(
      `Balance SuccessUser USDC tokens ${await usdc.balanceOf(successUser)}`
    );
    console.log(
      `Balance SuccessUser XDAI tokens ${await xdai.balanceOf(successUser)}`
    );
  });

  it('PROJECT TOKEN', async () => {
    projectToken = await ERC20.deploy('PROJECT', 'PROJECT', 18);
    projectToken = await projectToken.deployed();
    const projectTokenAddress = projectToken.address;
    expect(projectTokenAddress).toBeProperAddress();
    log(`Deploed ERC20 PROJECT ${projectTokenAddress}`);
    const setProjectTokenTx = await venture.setProjectToken(
      projectTokenAddress
    );
    await setProjectTokenTx.wait();
    const needProjectTokens = await venture.calculateNeedProjectTokens();
    expect(needProjectTokens).toBeGteBN(0);
    console.log(`Need project tokens ${needProjectTokens}`);
    const projectTokenApproveTx = await projectToken.approve(
      ventureAddress,
      params.distributeProjectTokenAmount * 10
    );
    await projectTokenApproveTx.wait();
  });

  it('FEE TYPE OF 2', async () => {
    if (vSettings.settings[1] == 2) {
      expect(typeof params.capAmount).toBe('number');
      expect(params.capAmount).toBeGreaterThanOrEqual(0);
      console.log(`Set Cap Amount ${params.capAmount}`);
      const setCapAmountTx = await venture.setCapAmount(params.capAmount);
      await setCapAmountTx.wait();
      expect(typeof params.currentProjectTokenPrice).toBe('number');
      expect(params.currentProjectTokenPrice).toBeGreaterThanOrEqual(0);
      console.log(
        `Set Project Token Price ${params.currentProjectTokenPrice / 100}$`
      );
      const setProjectTokenPriceTx = await venture.setProjectTokenPrice(
        params.currentProjectTokenPrice
      );
      await setProjectTokenPriceTx.wait();
    }
  });

  it('DESTRIBUTE TOKENS', async () => {
    const distributeProjectTokenTx = await venture.distributeProjectToken(
      params.distributeProjectTokenAmount,
      0
    );
    await distributeProjectTokenTx.wait();
    // second time
    expect(
      await venture.calculateSuccessFeeAmountTokenForType2(
        params.distributeProjectTokenAmount
      )
    ).toBeGtBN(0);
    console.log(
      `Success Fee Amount Tokens ${await venture.calculateSuccessFeeAmountTokenForType2(
        params.distributeProjectTokenAmount
      )}`
    );
    const distributeProjectTokenTx2 = await venture.distributeProjectToken(
      params.distributeProjectTokenAmount,
      0
    );
    await distributeProjectTokenTx2.wait();
    expect(await projectToken.balanceOf(superUser)).toEqBN(0);
    console.log(
      `Balance superUser Project Tokens ${await projectToken.balanceOf(
        superUser
      )}`
    );
  });
});
