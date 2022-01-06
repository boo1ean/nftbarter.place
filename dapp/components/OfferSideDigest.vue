<template lang="pug">
v-container(fluid)
  .loader(v-if="isLoading")
    h4 Loading...
  v-row(v-if="nftAssets.length")
    v-col
      h4 NFTS
      v-simple-table(dense)
        template(v-slot:default)
          thead
            tr
              th Token
              th Metadata
          tbody
            tr(v-for="item in nftAssets")
              td
                NFTLink(:contract="item.token_address", :token-id="item.token_id")
              td
                NFTMetadata(:data="item.metadata")
  v-row(v-if="erc20Assets.length")
    v-col
      h4 ERC20 Tokens
      v-simple-table(dense)
        template(v-slot:default)
          thead
            tr
              th Symbol
              th Contract
              th Amount
          tbody
            tr(v-for="item in erc20Assets")
              td
                ContractLink(:address="item.symbol")
              td
                ContractLink(:address="item.address")
              td
                TokenBalance(:balance="item.amount" :decimals="item.decimals")

</template>
<script>
import NFTLink from '@/components/NFTLink'
import Moralis from '@/utils/moralis'
import NFTMetadata from '@/components/NFTMetadata'

export default {
  name: 'OfferSideDigest',
  props: ['address', 'assets'],
  components: {
    NFTLink,
    NFTMetadata,
  },
  data () {
    return {
      isLoading: true,
      nftAssets: [],
      erc20Assets: []
    }
  },
  async mounted () {
    this.isLoading = true
    const nfts = this.assets.filter(x => +x.assetType !== 1)
    const erc20s = this.assets.filter(x => +x.assetType === 1)

    const nftsPromises = []
    for (const nft of nfts) {
      const options = {
        address: nft.contractAddress,
        token_id: nft.tokenId,
        chain: this.$store.state.account.chain
      }
      nftsPromises.push(Moralis.Web3API.token.getTokenIdMetadata(options))
    }
    const erc20Promises = []
    for (const erc20 of erc20s) {
      const options = {
        addresses: erc20.contractAddress,
        chain: this.$store.state.account.chain
      }
      erc20Promises.push(Moralis.Web3API.token.getTokenMetadata(options).then(([token]) => {
        return {
          ...token,
          amount: erc20.amount,
        }
      }))
    }

    this.nftAssets = await Promise.all(nftsPromises)
    this.erc20Assets = await Promise.all(erc20Promises)
    this.isLoading = false
  },
}
</script>
