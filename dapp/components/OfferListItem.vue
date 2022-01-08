<template lang="pug">
  v-card
    v-card-text
      table
        tr
          td
            b ID
          td {{ offer.id }}
        tr
          td.pr-3
            b From
          td {{ offer.side0 }}
        tr
          td.pr-3
            b To
          td {{ offer.side1 }}
        tr
          td.pr-3
            b Swap
          td {{ swapDigest }}
    v-card-actions
      v-btn(
        nuxt
        :to="`/offers/${offer.id}?chain=${chain}`"
      ) OPEN DETAILS
</template>
<script>
export default {
  name: 'OfferListItem',
  props: ['offer'],
  computed: {
    chain () {
      return this.$store.state.account.network.chain
    },
    swapDigest () {
      const side0nfts = this.offer.side0Assets.filter(a => +a.assetType === 0)
      const side0erc20 = this.offer.side0Assets.filter(a => +a.assetType === 1)
      const side1nfts = this.offer.side1Assets.filter(a => +a.assetType === 0)
      const side1erc20 = this.offer.side1Assets.filter(a => +a.assetType === 1)
      const result = []
      if (side0nfts.length > 0) {
        result.push(`${side0nfts.length} NFTs`)
      }
      if (side0erc20.length > 0) {
        result.push(`${side0nfts.length} Tokens`)
      }
      if (!side0nfts.length && !side0erc20.length) {
        result.push('Nothing')
      }
      result.push(' ↔ ')
      if (side1nfts.length > 0) {
        result.push(`${side1nfts.length} NFTs`)
      }
      if (side1erc20.length > 0) {
        result.push(`${side1nfts.length} Tokens`)
      }
      if (!side1nfts.length && !side1erc20.length) {
        result.push('Nothing')
      }
      return result.join(' ')
    },
  },
}
</script>
