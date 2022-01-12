import Moralis from './moralis'
import abis from './standart-abis.json'
import contractsConfig from '@/contracts-config.json'
import { getCurrentWeb3Network } from '@/utils/networks'
const contracts = {
  async createERC20 (address) {
    const web3 = await Moralis.enableWeb3()
    return new web3.eth.Contract(abis.ERC20, address)
  },
  async createERC721 (address) {
    const web3 = await Moralis.enableWeb3()
    return new web3.eth.Contract(abis.ERC721, address)
  },
  async createBarterContract () {
    const web3 = await Moralis.enableWeb3()
    const network = getCurrentWeb3Network()
    if (!network || !contractsConfig.BarterPlace[network.chain]) {
      // window.alert('Active chain is not supported (yet?)')
      throw new Error('Active chain is not supported (yet?)')
    }
    return new web3.eth.Contract(
      contractsConfig.BarterPlace.abi,
      contractsConfig.BarterPlace[network.chain],
    )
  },
}

export default contracts
