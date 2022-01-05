import Moralis from './moralis'
import contractsConfig from '@/contracts-config.json'

let barterContract
export default async () => {
  if (barterContract) {
    return barterContract
  }
  const web3 = await Moralis.enableWeb3()
  barterContract = new web3.eth.Contract(contractsConfig.BarterPlace.abi, contractsConfig.BarterPlace.address)
  return barterContract
}
