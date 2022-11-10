async function main({ owner, verbose } = {}) {
  const log = (...args) => {
    if (verbose) {
      console.log(...args);
    }
  };
  let accounts = await ethers.getSigners();
  owner = accounts[0].address;
  const simpleUserAccount = accounts[1];
  const superUserAccount = accounts[2];
  const successUserAccount = accounts[3];
  const simpleUser = accounts[1].address;
  const superUser = accounts[2].address;
  const successUser = accounts[3].address;
  log('owner: ', owner);
  log('simpleUser: ', simpleUser);
  log('superUser: ', superUser);

  const params = {
    contributeAmount: 1000,
    capAmount: 1000,
    distributeProjectTokenAmount: 1000,
    baseProjectTokenPrice: 100,
    currentProjectTokenPrice: 200,
  };
  const vSettings = {
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
  // PREPARING
  const ERC20 = await hre.ethers.getContractFactory('ERC20');

  let usdc = await ERC20.deploy('USDC', 'USDC', 18);
  usdc = await usdc.deployed();
  const usdcAddress = usdc.address;
  log(`Deploed ERC20 USDC ${usdcAddress}`);

  let xdai = await ERC20.deploy('XDAI', 'XDAI', 18);
  xdai = await xdai.deployed();
  const xdaiAddress = xdai.address;
  log(`Deploed ERC20 XDAI ${xdaiAddress}`);

  // SEND TOKENS
  await xdai.transfer(simpleUser, params.contributeAmount);
  await usdc.transfer(superUser, params.contributeAmount);
  console.log(`Balance ERC20 tokens ${await usdc.balanceOf(superUser)}`);

  log('Deploying Venture...');
  const Venture = await hre.ethers.getContractFactory('VentureRemix');
  let venture = await Venture.deploy();
  venture = await venture.deployed();
  const ventureAddress = venture.address;
  log(`Venture: ${ventureAddress}`);
  // INITIALIZE
  const ventureInitializeTx = await venture.initialize(
    vSettings.limitAmounts,
    vSettings.commissions,
    vSettings.wallets,
    vSettings.settings
  );
  await ventureInitializeTx.wait();
  console.log(await venture.walletAddressForSuccessFundraising());

  // ADD ACCEPTABLE TOKEN
  const ventureAddAcceptableTokenTx1 = await venture.addAcceptableToken(
    usdcAddress
  );
  await ventureAddAcceptableTokenTx1.wait();
  const ventureAddAcceptableTokenTx2 = await venture.addAcceptableToken(
    xdaiAddress
  );
  await ventureAddAcceptableTokenTx2.wait();

  // ADD PRIVELEGED USERS
  const ventureAddPrivelegedUsersTx = await venture.addPrivelegedUsers([
    superUser,
  ]);
  await ventureAddPrivelegedUsersTx.wait();

  // APPROVE SOME TOKENS TO VENTURE CONTRACT
  const erc20ApproveTx1 = await usdc
    .connect(superUserAccount)
    .approve(ventureAddress, params.contributeAmount);
  await erc20ApproveTx1.wait();
  const erc20ApproveTx2 = await xdai
    .connect(simpleUserAccount)
    .approve(ventureAddress, params.contributeAmount);
  await erc20ApproveTx2.wait();

  // CONTRIBUTE
  const ventureContributeTx1 = await venture
    .connect(superUserAccount)
    .contribute(usdcAddress, params.contributeAmount);
  await ventureContributeTx1.wait();
  const ventureContributeTx2 = await venture
    .connect(simpleUserAccount)
    .contribute(xdaiAddress, params.contributeAmount);
  await ventureContributeTx2.wait();

  //CHECKS
  console.log(
    `Balance VENTURE USDC tokens ${await usdc.balanceOf(ventureAddress)}`
  );
  console.log(`getContributes ${await venture.getContributes()}`);

  // STOP STOPFUNDRAISING
  const ventureStopFundraisingTx = await venture.stopFundraising();
  await ventureStopFundraisingTx.wait();
  console.log(
    `Balance SuccessUser USDC tokens ${await usdc.balanceOf(successUser)}`
  );
  console.log(
    `Balance SuccessUser XDAI tokens ${await xdai.balanceOf(successUser)}`
  );

  //PROJECT TOKEN
  let projectToken = await ERC20.deploy('PROJECT', 'PROJECT', 18);
  projectToken = await projectToken.deployed();
  const projectTokenAddress = projectToken.address;
  log(`Deploed ERC20 PROJECT ${projectTokenAddress}`);
  const setProjectTokenTx = await venture.setProjectToken(projectTokenAddress);
  await setProjectTokenTx.wait();
  const needProjectTokens = await venture.calculateNeedProjectTokens();
  console.log(`Need project tokens ${needProjectTokens}`);
  const projectTokenApproveTx = await projectToken.approve(
    ventureAddress,
    params.distributeProjectTokenAmount * 10
  );
  await projectTokenApproveTx.wait();

  // FEE TYPE OF 2
  if (vSettings.settings[1] == 2) {
    console.log(`Set Cap Amount ${params.capAmount}`);
    const setCapAmountTx = await venture.setCapAmount(params.capAmount);
    await setCapAmountTx.wait();
    console.log(
      `Set Project Token Price ${params.currentProjectTokenPrice / 100}$`
    );
    const setProjectTokenPriceTx = await venture.setProjectTokenPrice(
      params.currentProjectTokenPrice
    );
    await setProjectTokenPriceTx.wait();
  }

  // DESTRIBUTE TOKENS
  const distributeProjectTokenTx = await venture.distributeProjectToken(
    params.distributeProjectTokenAmount,
    0
  );
  await distributeProjectTokenTx.wait();
  // second time
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
  console.log(
    `Balance superUser Project Tokens ${await projectToken.balanceOf(
      superUser
    )}`
  );

  //
}
main({ owner: process.env.OWNER, verbose: true })
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/*
getPriceForUser ( addressUser, amount)

return множитель

cap amount при инициализации

new Reward
("xxx", false, comunityToke, projectToken, amount, currentBlock, uiin256 max, 1, 0)
*/
