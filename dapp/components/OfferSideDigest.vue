<template lang="pug">
.loader(v-if="isLoading")
  h4 Loading...
v-simple-table(v-else dense).mt-5
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
    const nfts = this.assets.filter(x => +x.assetType === 0)
    const nftsPromises = []
    for (const nft of nfts) {
      const options = {
        address: nft.contractAddress,
        token_id: nft.tokenId,
        chain: this.$store.state.account.chain
      }
      nftsPromises.push(Moralis.Web3API.token.getTokenIdMetadata(options))
    }

    this.nftAssets = await Promise.all(nftsPromises)
    this.isLoading = false
  },
}
</script>
