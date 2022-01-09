import _ from 'lodash'
import Moralis from '../utils/moralis'
import contracts from '@/utils/contracts'

const networks = [
  {
    name: 'BSC',
    chainId: 56,
    explorerURL: 'https://bscscan.com',
    chain: 'bsc',
    color: '#F8D12F',
    details: {
      chainId: 56,
      chainName: 'Binance Smart Chain',
      currencyName: 'BNB',
      currencySymbol: 'BNB',
      rpcUrl: 'https://bsc-dataseed1.ninicoin.io',
      blockExplorerUrl: 'https://bscscan.com/',
    },
  },
  {
    name: 'Avalanche',
    chainId: 43114,
    explorerURL: 'https://snowtrace.io',
    chain: 'avalanche',
    color: '#e84142',
    details: {
      chainId: 43114,
      chainName: 'Avalanche',
      currencyName: 'AVAX',
      currencySymbol: 'AVAX',
      rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
      blockExplorerUrl: 'https://cchain.explorer.avax.network/',
    },
  },
  {
    name: 'Polygon',
    chainId: 137,
    explorerURL: 'https://polygonscan.com',
    chain: 'polygon',
    color: '#8247e5',
    details: {
      chainId: 137,
      chainName: 'Polygon',
      currencyName: 'MATIC',
      currencySymbol: 'MATIC',
      rpcUrl: 'https://polygon-rpc.com',
      blockExplorerUrl: 'https://polygonscan.com/',
    },
  },
  {
    name: 'Ropsten Test Network',
    chainId: 3,
    explorerURL: 'https://ropsten.etherscan.io',
    chain: 'ropsten',
    color: '#ff4a8d',
    details: {
      chainId: 3,
      chainName: 'Ropsten Test Network',
      currencyName: 'ETH',
      currencySymbol: 'ETH',
      rpcUrl: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      blockExplorerUrl: 'https://ropsten.etherscan.io',
    },
  },
]

// await Moralis.addNetwork(
//     chainId,
//     chainName,
//     currencyName,
//     currencySymbol,
//     rpcUrl,
//     blockExplorerUrl
// );

const initialState = {
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
  chain (state) {
    return _.get(state, 'network.chain')
  },
  networkColor (state) {
    return _.get(state, 'network.color', 'black')
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
    const barterContract = await contracts.createBarterContract()
    try {
      const address = this.getters['account/address']
      const offers = await barterContract.methods.getOffersByAddress(address).call({ from: address })
      commit('setOffers', offers)
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
    const isConnected = _.get(window, 'web3.currentProvider.selectedAddress', false)
    if (isConnected) {
      const web3 = await Moralis.enableWeb3()
      const address = web3.eth.currentProvider.selectedAddress
      const chainId = await Moralis.getChainId()
      commit('setupAccount', { address, chainId })
      dispatch('fetchAccountOffers')
    }
  },
  async ensureChain ({ commit }, chain) {
    const network = _.find(networks, { chain })
    if (!network) {
      return
    }
    try {
      await Moralis.switchNetwork('0x' + network.chainId.toString(16))
      commit('setNetwork', network)
    } catch (e) {}
  },
}

function assignUniqueId (nft) {
  nft.uniqueId = `${nft.token_address}-${nft.token_id}`
  return nft
}
