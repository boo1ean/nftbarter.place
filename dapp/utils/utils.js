import Moralis from './moralis'

export const web3Utils = new Moralis.Web3()

export function toBN (val) {
  return web3Utils.utils.toBN(val)
}
