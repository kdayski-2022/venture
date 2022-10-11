async function main({
    owner,
    verbose
} = {}) {
    const log = (...args) => {
        if (verbose) { console.log(...args) }
    }
    let accounts = await ethers.getSigners()
    owner = accounts[0].address
    const simpleUser = accounts[1].address
    const superUser = accounts[2].address
    const successUser = accounts[3].address
    log("owner: ", owner)
    log("simpleUser: ", simpleUser)
    log("superUser: ", superUser)
    const params = {
        contributeAmount: 200
    }
    const ventureSettings = [
        10, // _maxAmountForUser,
        100, // _minAmountForUser,
        100, // _minAmountForPrivilegedUser,
        1000, // _maxAmountForPrivilegedUser,
        500, // _commission 5%,
        100, // _weeziComission 1%,
        1000, // _commissionPrivileged 10%,
        500, // _weeziComissionPrivileged 5%,
        successUser, // _walletAddressForSuccessFundraising,
        10, // _maxNumbersOfContributers
    ]
    // PREPARING
    const ERC20 = await hre.ethers.getContractFactory('ERC20')
    log('Deploying ERC20...')
    let erc20 = await ERC20.deploy("FAN", "FAN", 18)
    erc20 = await erc20.deployed()
    const addressContributeToken = erc20.address
    log('Deploying Venture...')
    const Venture = await hre.ethers.getContractFactory('VentureRemix')
    let venture = await Venture.deploy()
    venture = await venture.deployed()
    const ventureAddress = venture.address
    // INITIALIZE
    const ventureInitializeTx = await venture.initialize(...ventureSettings)
    await ventureInitializeTx.wait()
    console.log(await venture.walletAddressForSuccessFundraising())

    // ADD ACCEPTABLE TOKEN
    const ventureAddAcceptableTokenTx = await venture.addAcceptableToken(addressContributeToken)
    await ventureAddAcceptableTokenTx.wait()

    // ADD PRIVELEGED USERS
    const ventureAddPrivelegedUsersTx = await venture.addPrivelegedUsers([owner])
    await ventureAddPrivelegedUsersTx.wait()

    // APPROVE SOME TOKENS TO VENTURE CONTRACT
    const erc20ApproveTx = await erc20.approve(ventureAddress, params.contributeAmount)
    await erc20ApproveTx.wait()

    // CONTRIBUTE
    const ventureContributeTx = await venture.contribute(addressContributeToken, params.contributeAmount)
    await ventureContributeTx.wait()

    //CHECKS
    console.log(`Balance VENTURE ERC20 tokens ${await erc20.balanceOf(ventureAddress)}`)
    console.log(`getContributes ${await venture.getContributes()}`)
    console.log(`calculatePercentage ${await venture.calculatePercentage(1000, 100 * 100)}`)

    // STOP STOPFUNDRAISING
    const ventureStopFundraisingTx = await venture.stopFundraising()
    await ventureStopFundraisingTx.wait()
    console.log(`Balance VENTURE ERC20 tokens ${await erc20.balanceOf(ventureAddress)}`)
    console.log(`Balance SuccessUser ERC20 tokens ${await erc20.balanceOf(successUser)}`)



}

main({ owner: process.env.OWNER, verbose: true })
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })