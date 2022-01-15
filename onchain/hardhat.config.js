require('@nomiclabs/hardhat-waffle')
require('hardhat-gas-reporter')
require('solidity-coverage')
require('@nomiclabs/hardhat-etherscan')

const { privateKey, etherscan } = require('./.secret.json')

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("mint", "Mint number of charaters to ADMIN account")
    .setAction(async (taskArgs, hre) => {
      const contractsConfig = require('../dapp/contracts-config.json')
      const accounts = await hre.ethers.getSigners()
      const NFT1 = new hre.ethers.Contract(
          contractsConfig.NFT1.address,
          contractsConfig.NFT1.abi,
          accounts[0]
      )
      const ERC201 = new hre.ethers.Contract(
          contractsConfig.ERC201.address,
          contractsConfig.ERC201.abi,
          accounts[0]
      )

      await NFT1.safeMint(accounts[0].address)
      await NFT1.safeMint(accounts[0].address)
      await NFT1.safeMint(accounts[0].address)
      await ERC201.mint(accounts[0].address, 100)
    });

module.exports = {
	solidity: "0.8.4",
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {},
		localhost: {
			url: "http://127.0.0.1:8545"
		},
		bsc: {
			url: "https://bsc-dataseed.binance.org/",
			chainId: 56,
			gasPrice: 20000000000,
			accounts: [privateKey],
		},
		bscTestnet: {
			url: "https://data-seed-prebsc-1-s1.binance.org:8545",
			chainId: 97,
			gasPrice: 20000000000,
			accounts: [privateKey],
		},
		ropsten: {
			url: "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
			chainId: 3,
			gasPrice: 20000000000,
			accounts: [privateKey],
		},
		avalanche: {
			url: "https://api.avax.network/ext/bc/C/rpc",
			chainId: 43114,
			gasPrice: 20000000000,
			accounts: [privateKey],
		},
		avalancheFujiTestnet: {
			url: "https://api.avax-test.network/ext/bc/C/rpc",
			chainId: 43113,
			gasPrice: 25000000000,
			accounts: [privateKey],
		},
		polygon: {
			url: "https://polygon-rpc.com",
			chainId: 137,
			gasPrice: 20000000000,
			accounts: [privateKey],
		},
		polygonMumbai: {
			url: "https://matic-mumbai.chainstacklabs.com",
			chainId: 80001,
			gasPrice: 20000000000,
			accounts: [privateKey],
		},
	},
	etherscan: {
		apiKey: {
			mainnet: "YOUR_ETHERSCAN_API_KEY",
			ropsten: etherscan.ropsten,
            
			bsc: etherscan.bsc,
			bscTestnet: etherscan.bscTestnet,
            
			polygon: etherscan.polygon,
			polygonMumbai: etherscan.polygonMumbai,
            
			avalanche: etherscan.avalanche,
			avalancheFujiTestnet: etherscan.avalancheFujiTestnet,
		}
	}
}
