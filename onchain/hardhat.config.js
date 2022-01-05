require("@nomiclabs/hardhat-waffle")
require("hardhat-gas-reporter")
require('solidity-coverage')
const { privateKey } = require('./.secret.json')

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
		localhost: {
			url: "http://127.0.0.1:8545"
		},
		hardhat: {
		},
		testnet: {
			url: "https://data-seed-prebsc-1-s1.binance.org:8545",
			chainId: 97,
			gasPrice: 20000000000,
			accounts: [privateKey],
		},
		mainnet: {
			url: "https://bsc-dataseed.binance.org/",
			chainId: 56,
			gasPrice: 20000000000,
			accounts: [privateKey],
		}
	},
	//solidity: {
		//version: "0.5.16",
		//settings: {
			//optimizer: {
				//enabled: true
			//}
		//}
	//},
}
