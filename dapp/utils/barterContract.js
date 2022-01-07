import Moralis from './moralis'
import contractsConfig from '@/contracts-config.json'

export default async () => {
  const web3 = await Moralis.enableWeb3()
  return new web3.eth.Contract(contractsConfig.BarterPlace.abi, contractsConfig.BarterPlace.address)
}
