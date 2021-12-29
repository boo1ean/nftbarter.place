import Moralis from '../utils/moralis'

const user = Moralis.User.current()

const initialState = {
  user,
  nfts: [],
  isLoading: false
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
  }
}

export const getters = {
  address (state) {
    if (state.user == null) {
      return null
    }
    return state.user.get('ethAddress')
  }
}

export const actions = {
  async login ({ commit }) {
    let user = Moralis.User.current()
    if (!user) {
      try {
        user = await Moralis.authenticate({ signingMessage: 'Log in using Moralis' })
        commit('setUser', user)
      } catch (e) {
        console.error('Unable to fetch user')
      }
    } else {
      commit('setUser', user)
    }
  },
  async fetchAccountNFTS ({ state, commit }) {
    const options = { chain: 'bsc', address: state.user.get('ethAddress') }
    commit('setLoadingStatus', true)
    const nfts = await Moralis.Web3API.account.getNFTs(options)
    commit('setNfts', nfts.result.map(assignUniqueId))
    commit('setLoadingStatus', false)
  }
}

function assignUniqueId (nft) {
  nft.uniqueId = `${nft.token_address}-${nft.token_id}`
  return nft
}
