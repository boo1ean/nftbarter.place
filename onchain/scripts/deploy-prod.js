const _ = require('lodash')
const hre = require("hardhat")
const fs = require("fs")
const existingConfig = require('../../dapp/contracts-config.json')

class Ref {
    constructor (path) {
        this.path = path
    }
}

function ref (path) {
    return new Ref(path)
}

const contracts = [
    {
        name: "BarterPlace",
    },
]

const deployedContracts = {}

async function main() {
    for (const contractConfig of contracts) {
        deployedContracts[contractConfig.name] = await deployContract(contractConfig)
    }

    generateFrontendConfig()
}
async function deployContract (config) {
    const contract = await hre.ethers.getContractFactory(config.name)
    const constructorArguments = resolveConstructorArguments(config)
    const contractInstance = await contract.deploy.apply(contract, constructorArguments)
    return contractInstance.deployed()
}

function resolveConstructorArguments (config) {
    if (config.constructorArguments) {
        return config.constructorArguments.map(argDependency => {
            if (argDependency instanceof Ref)  {
                return _.get(deployedContracts, argDependency.path)
            }
            return argDependency
        })
    }

    return []
}

function generateFrontendConfig () {
    for (const contractName in deployedContracts) {
        if (existingConfig[contractName]) {
            existingConfig[contractName][hre.network.name] = deployedContracts[contractName].address
            existingConfig[contractName].abi = artifacts.readArtifactSync(contractName).abi
        } else {
            existingConfig[contractName] = {
                [hre.network.name]: deployedContracts[contractName].address,
                abi: artifacts.readArtifactSync(contractName).abi,
            }
        }
    }

    fs.writeFileSync(__dirname + "/../../dapp/contracts-config.json", JSON.stringify(existingConfig))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
