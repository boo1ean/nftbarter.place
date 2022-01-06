import _ from 'lodash'
import Moralis from '../utils/moralis'
import getBarterContract from '../utils/barterContract'

const DEFAULT_CHAIN = 'bsc'
const networks = [
  {
    name: 'BSC',
    chainId: 56,
    explorer: 'https://bscscan.com',
  },
  {
    name: 'Avalanche',
    chainId: 43114,
    explorer: 'https://snowtrace.io',
  },
  {
    name: 'Polygon',
    chainId: 137,
    explorer: 'https://polygonscan.com',
  },
]

const initialState = {
  chain: DEFAULT_CHAIN,
  user: null,
  nfts: [],
  isLoading: false,
  offers: [],
  networks,
  network: null,
}

export const state = () => ({ ...initialState })

export const mutations = {
  setUser (state, user) {
    state.user = user
  },
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
}

export const getters = {
  address (state) {
    if (state.user == null) {
      return null
    }
    return state.user.get('ethAddress').toLowerCase()
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
    let user = Moralis.User.current()
    if (!user) {
      try {
        user = await Moralis.authenticate()
        commit('setUser', user)
      } catch (e) {
        console.error('Unable to fetch user')
      }
    } else {
      commit('setUser', user)
    }
  },
  async fetchAccountNFTS ({ state, commit }) {
    const options = { address: state.user.get('ethAddress') }
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
    await Moralis.enableWeb3()
    const chainId = await Moralis.getChainId()
    console.log(chainId)
    dispatch('setNetworkByChainId', chainId)

    const currentUser = Moralis.User.current()
    if (currentUser) {
      commit('setUser', currentUser)
      dispatch('fetchAccountOffers')
    }
  }
}

function assignUniqueId (nft) {
  nft.uniqueId = `${nft.token_address}-${nft.token_id}`
  return nft
}
