import Moralis from '../utils/moralis'
import getBarterContract from '../utils/barterContract'

Moralis.enableWeb3()
const user = Moralis.User.current()

const DEFAULT_CHAIN = 'bsc'
const initialState = {
  chain: DEFAULT_CHAIN,
  user,
  nfts: [],
  isLoading: false,
  offers: [],
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
  }
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
    return state.offers.filter(o => +o.status === 0 && o.side0.toLowerCase() === address)
  },
  outgoingOffers (state, getters) {
    const address = getters.address
    const offers = state.offers.filter(o => +o.status === 0 && o.side1.toLowerCase() === address)
    console.log(address, state.offers, offers)
    return offers
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

  // async fetchAccountOffers ({ state, commit }) {
  async fetchAccountOffers ({ commit }) {
    const address = this.getters['account/address']
    const barterContract = await getBarterContract()
    const offers = await barterContract.methods.getOffers().call({ from: address })
    commit('setOffers', offers)
  }
}

function assignUniqueId (nft) {
  nft.uniqueId = `${nft.token_address}-${nft.token_id}`
  return nft
}
