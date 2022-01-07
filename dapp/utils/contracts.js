import Moralis from './moralis'
import abis from './standart-abis.json'

const contracts = {
  async createERC20 (address) {
    const web3 = await Moralis.enableWeb3()
    return new web3.eth.Contract(abis.ERC20, address)
  },
  async createERC721 (address) {
    const web3 = await Moralis.enableWeb3()
    return new web3.eth.Contract(abis.ERC721, address)
  },
}

export default contracts
