require('hardhat-jest-plugin');
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('@nomiclabs/hardhat-web3');

task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  solidity: {
    version: '0.4.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 10,
      },
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      allowUnlimitedContractSize: true,
      accounts: {
        count: 4,
      },
    },
    rpc: {
      network_id: 14,
      url: 'http://localhost:8545',
      gas: 7e6,
      gasPrice: 500000000,
      gas: 6.9e6,
    },
    rinkeby: {
      url: 'https://rinkeby.eth.aragon.network',
      // accounts: accounts("rinkeby"),
      accounts: [
        '4326b2d2c3f07ef7723aa9f509c53465057258c2a5f126647d569948b357401d',
      ],
      // ensRegistry: "0xc83d42f8f6e06e72a148768bd1a7a351358217b1",
      ensRegistry: '0x6a0451a24b19a67ab02681f97ab3c06697372bf5',
      timeout: 1000000,
      gas: 6.9e6,
      gasPrice: 15000000001,
    },
    polygon: {
      url: 'https://rpc.ankr.com/polygon',
      accounts: [
        '808e7d89da689a6e9ef3bea93a0fa73e183b65114b7ebc28fa9571b499a32e17',
      ],
      gas: 8e6,
      gasPrice: 33000000000,
    },
    mainnet: {
      url: 'https://eth-mainnet.g.alchemy.com/v2/nce6-aJW3eOvITPHD9adrHuamekTyEpb',
      accounts: [
        '808e7d89da689a6e9ef3bea93a0fa73e183b65114b7ebc28fa9571b499a32e17',
      ],
      gasPrice: 5000000000,
      gas: 8e6,
    },
    mumbai: {
      // url: "https://rpc-mumbai.matic.today",
      // url: "https://matic-mumbai.chainstacklabs.com",
      // url: "https://rpc.ankr.com/polygon_mumbai",
      url: 'https://rpc-mumbai.maticvigil.com',
      // accounts: accounts("rinkeby"),
      accounts: [
        '808e7d89da689a6e9ef3bea93a0fa73e183b65114b7ebc28fa9571b499a32e17',
      ],
      // accounts: ["c67ce4cf24ec1a6ab51c23abc08c6ee362fc60a130e06adb21c48fa02f625ad1"],
      // accounts: ["808e7d89da689a6e9ef3bea93a0fa73e183b65114b7ebc28fa9571b499a32e17"],
      // accounts: ["fdd8a5e34c568dd3de7ea1f569f5de3288d6fdfe399ac3a0bfafdf0981743a9f"],
      // ensRegistry: "0x98Df287B6C145399Aaa709692c8D308357bC085D",
      // timeout: 10000000,
      gasPrice: 5000000000,
      gas: 8e6,
    },
    bscTest: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      // accounts: accounts("rinkeby"),
      accounts: [
        '4326b2d2c3f07ef7723aa9f509c53465057258c2a5f126647d569948b357401d',
      ],
      // accounts: ["fdd8a5e34c568dd3de7ea1f569f5de3288d6fdfe399ac3a0bfafdf0981743a9f"],
      // ensRegistry: "0x98Df287B6C145399Aaa709692c8D308357bC085D",
      timeout: 10000000,
      // gasPrice: 2500000007,
      // gas: 18000000
    },
  },
  ipfs: {
    url: 'https://ipfs.infura.io:5001/',
    pinata: {
      key: process.env.PINATA_KEY || 'c3ce0a276d9339578da7',
      secret:
        process.env.PINATA_SECRET_KEY ||
        '46b24e90fdc1c494027269aceb75f43ab60108961d1962c13d2cd412e355c4c0',
    },
  },
  mocha: {
    timeout: 30000,
  },
  etherscan: {
    // apiKey: process.env.ETHERSCAN_API_KEY
    apiKey: 'BAFQGJ4M5B94JHBB1HESS4BQGIUJNKXXMB' /* Etherscan */,
    // apiKey: "82C8JFDCT4PH1791FHGVYK3INN2S5RJ1YC" /* polygon */
    // apiKey: "GSYYDG6Z48HQ4ZC6K7XNBU9UTZI21GV38Y" /* bsc */
  },
};
