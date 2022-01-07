import _ from 'lodash'
import Moralis from '../utils/moralis'
import getBarterContract from '../utils/barterContract'

const DEFAULT_CHAIN = 'bsc'
const networks = [
  {
    name: 'BSC',
    chainId: 56,
    explorerURL: 'https://bscscan.com',
  },
  {
    name: 'Avalanche',
    chainId: 43114,
    explorerURL: 'https://snowtrace.io',
  },
  {
    name: 'Polygon',
    chainId: 137,
    explorerURL: 'https://polygonscan.com',
  },
]

const initialState = {
  chain: DEFAULT_CHAIN,
  isLoading: false,
  nfts: [],
  offers: [],
  networks,
  network: null,
  address: null,
}

export const state = () => ({ ...initialState })

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
    console.log('account.mutations.setAccount', { address, chainId })
    state.address = address
    state.network = _.find(networks, { chainId })
  },
}

export const getters = {
  address (state) {
    return state.address
  },
  incomingOffers (state, getters) {
    const address = getters.address
    return state.offers.filter(o => +o.status === 0 && o.side1.toLowerCase() === address)
  },
  outgoingOffers (state, getters) {
    const address = getters.address
    return state.offers.filter(o => +o.status === 0 && o.side0.toLowerCase() === address)
  },
}

export const actions = {
  async login ({ commit }) {
    console.log('account.actions.login')
    try {
      const web3 = await Moralis.enableWeb3()
      const address = web3.eth.currentProvider.selectedAddress
      const chainId = await Moralis.getChainId()
      commit('setupAccount', { address, chainId })
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
  async fetchAccountOffers ({ commit }) {
    const barterContract = await getBarterContract()
    try {
      const offers = await barterContract.methods.getOffers().call({ from: this.getters['account/address'] })
      commit('setOffers', offers)
    } catch (e) {
      console.error('Offers fetch error', e)
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
    const isConnected = _.get(window, 'web3.currentProvider.selectedAddress', false)
    if (isConnected) {
      const web3 = await Moralis.enableWeb3()
      const address = web3.eth.currentProvider.selectedAddress
      const chainId = await Moralis.getChainId()
      commit('setupAccount', { address, chainId })
      dispatch('fetchAccountOffers')
    }
  },
}

function assignUniqueId (nft) {
  nft.uniqueId = `${nft.token_address}-${nft.token_id}`
  return nft
}
