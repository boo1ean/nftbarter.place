import _ from 'lodash'

export const networks = [
  {
    name: 'BSC',
    chainId: 56,
    explorerURL: 'https://bscscan.com',
    chain: 'bsc',
    color: '#F0B90B',
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
    name: '[TEST] Ropsten',
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
  {
    name: '[TEST] Avalanche Fuji',
    chainId: 43113,
    explorerURL: 'https://testnet.snowtrace.io',
    chain: 'avalancheFujiTestnet',
    color: '#e84142',
    details: {
      chainId: 43113,
      chainName: '[TEST] Avalanche Fuji',
      currencyName: 'AVAX',
      currencySymbol: 'AVAX',
      rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
      blockExplorerUrl: 'https://testnet.snowtrace.io',
    },
  },
  {
    name: '[TEST] Polygon Mumbai',
    chainId: 80001,
    explorerURL: 'https://mumbai.polygonscan.com',
    chain: 'polygonMumbai',
    color: '#8247e5',
    details: {
      chainId: 80001,
      chainName: '[TEST] Polygon Mumbai',
      currencyName: 'MATIC',
      currencySymbol: 'MATIC',
      rpcUrl: 'https://matic-mumbai.chainstacklabs.com',
      blockExplorerUrl: 'https://mumbai.polygonscan.com',
    },
  },
]

export function getNetworkByChainId (chainId) {
  return _.find(networks, { chainId })
}

export function getCurrentWeb3Network () {
  return getNetworkByChainId(parseInt(_.get(window, 'web3.currentProvider.chainId'), 16))
}
