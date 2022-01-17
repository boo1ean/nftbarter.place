import _ from 'lodash'
import contractsConfigs from '../contracts-config.json'
import Moralis from '../utils/moralis'
import contracts from '@/utils/contracts'
import { networks } from '@/utils/networks'

const initialState = {
  isLoading: false,
  nfts: [],
  offers: [],
  networks: [...networks],
  network: null,
  address: null,
  isOwner: false,
  contractsAddresses: {
    barter: null,
  },
  fees: {
    createOfferFee: 0,
    acceptOfferFee: 0,
  },
}

export const state = () => ({ ...initialState })

let usableConnectRetries = 5
export const mutations = {
  setNfts (state, nfts) {
    state.nfts = nfts
  },
  setLoadingStatus (state, status) {
    state.isLoading = status
  },
  setOffers (state, offers) {
    state.offers = [].concat(offers)
  },
  setNetwork (state, network) {
    state.network = network
  },
  setupAccount (state, { address, chainId }) {
    state.address = address
    state.network = _.find(networks, { chainId })
    state.contractsAddresses.barter = contractsConfigs.BarterPlace[state.network.chain]
  },
  setOwner (state, value) {
    state.isOwner = value
  },
  setFees (state, fees) {
    state.fees = { ...fees }
  },
}

export const getters = {
  address (state) {
    return state.address
  },
  incomingOffers (state, getters) {
    const address = getters.address
    return getters.pendingOffers.filter(o => o.side1.toLowerCase() === address)
  },
  outgoingOffers (state, getters) {
    const address = getters.address
    console.log(getters.pendingOffers)
    return getters.pendingOffers.filter(o => o.side0.toLowerCase() === address)
  },
  pendingOffers (state) {
    const currentTime = new Date().getTime()
    return state.offers.filter((o) => {
      return +o.status === 0 && ((+o.deadline === 0) || (new Date(+o.deadline * 1000).getTime() > currentTime))
    })
  },
  chain (state) {
    return _.get(state, 'network.chain')
  },
  networkColor (state) {
    return _.get(state, 'network.color', 'black')
  },
  isReadyToRumble (state, getters) {
    return state.address && state.network && getters.barterContractAddress
  },
  barterContractAddress (state) {
    return state.contractsAddresses.barter
  },
  chainIdHex (state) {
    return '0x' + state.network.chainId.toString(16)
  },
}

export const actions = {
  async login ({ dispatch }) {
    try {
      await Moralis.enableWeb3()
      dispatch('sync')
    } catch (e) {
      console.error('accounts.actions.login', e)
    }
  },
  async fetchAccountNFTS ({ state, commit }) {
    const options = { address: state.address }
    commit('setLoadingStatus', true)
    const nfts = await Moralis.Web3API.account.getNFTs(options)
    commit('setNfts', nfts.result.map(assignUniqueId))
    commit('setLoadingStatus', false)
  },
  async fetchAccountOffers ({ state, commit }) {
    const barterContract = await contracts.createBarterContract()
    try {
      const address = this.getters['account/address']
      const [offers, createOfferFee, acceptOfferFee] = await Promise.all([
        barterContract.methods.getOffersByAddress(address).call({ from: address }),
        barterContract.methods.createOfferFee().call(),
        barterContract.methods.acceptOfferFee().call(),
      ])
      commit('setOffers', offers)
      commit('setFees', {
        createOfferFee: Moralis.Units.FromWei(createOfferFee) + ` ${state.network.details.currencySymbol}`,
        acceptOfferFee: Moralis.Units.FromWei(acceptOfferFee) + ` ${state.network.details.currencySymbol}`,
      })
    } catch (e) {
      console.error('Offers fetch error', e)
      commit('setOffers', [])
    }
  },
  setNetwork ({ commit }, network) {
    commit('setNetwork', network)
  },
  setNetworkByChainId ({ commit }, chainId) {
    // TODO check for id
    const network = _.find(networks, { chainId })
    commit('setNetwork', network)
  },
  async sync ({ commit, dispatch }) {
    const isConnected = _.get(window, 'ethereum.selectedAddress', false)
    if (isConnected) {
      const web3 = await Moralis.enableWeb3()
      const address = web3.eth.currentProvider.selectedAddress
      const chainId = await Moralis.getChainId()
      commit('setupAccount', { address, chainId })
      dispatch('fetchAccountOffers')
      try {
        const barterContract = await contracts.createBarterContract()
        const owner = await barterContract.methods.owner().call()
        commit('setOwner', owner.toLowerCase() === address.toLowerCase())
      } catch (e) {
        console.error('Contract interaction failed')
      }
    } else if (usableConnectRetries > 0) {
      // This is garbage for reconnected in deployed app
      usableConnectRetries--
      setTimeout(() => dispatch('sync'), 300)
    }
  },
  async ensureChain ({ commit }, chain) {
    const network = _.find(networks, { chain })
    if (!network) {
      return
    }
    try {
      try {
        if (!network.isDefaultInMetamask) {
          await Moralis.addNetwork(
            network.details.chainId,
            network.details.chainName,
            network.details.currencyName,
            network.details.currencySymbol,
            network.details.rpcUrl,
            network.details.blockExplorerUrl,
          )
        }
      } catch (e) {
        console.error('Network add attempt error', e)
      }
      await Moralis.switchNetwork('0x' + network.chainId.toString(16))
      commit('setNetwork', network)
    } catch (e) {}
  },
}
function assignUniqueId (nft) {
  nft.uniqueId = `${nft.token_address}-${nft.token_id}`
  return nft
}
