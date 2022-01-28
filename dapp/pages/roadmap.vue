<template lang="pug">
  v-row
    v-col(cols="12" md=6 offset-md=3)
      h1.mt-3.text-center ROADMAP
      v-timeline(dense)
        v-timeline-item(fill-dot color="green" icon="mdi-check")
          v-card.mb-3
            v-card-title Stage 0
            v-card-text
              ul
                li Barter ERC721, ERC20
                li Support for BSC, Avalanch, Polygon, Ropsten
                li Platform Launch
        v-timeline-item
          v-card.mb-3
            v-card-title Stage 1
            v-card-text
              ul
                li Gas-free offer creation
                li Marketplace
                li Additional EVM networks support (Fantom, Optimism, Arbitrum, etc.)
        v-timeline-item
          v-card.mb-3
            v-card-title Stage 2
            v-card-text
              ul
                li Going ICO
                li ERC20 token representing % in platform revenue (NOT FINANCIAL ASSET) (separate token for each supported chain)
                li Sell 51-70% of the token supply to the community
        v-timeline-item
          v-card.mb-3
            v-card-title Stage 3
            v-card-text
              ul
                li Become DAO
                li ERC20 token becomes Governance Token
                li Governance contracts system
                li DAO community will define all further development
</template>
<script>
export default {
  name: 'RoadmapPage',
  head () {
    return {
      title: 'Roadmap',
    }
  },
}
</script>
