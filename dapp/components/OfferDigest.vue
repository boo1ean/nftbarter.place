<template lang="pug">
div
  v-row
    v-col(lg="6" sm="12")
      v-card(
        :color="isSide0 ? 'amber lighten-5' : 'white'"
        elevation=1
      )
        v-card-title {{ isSide0 ? 'YOUR SIDE' : 'NOT YOUR SIDE' }}
        v-card-subtitle
          ContractLink(:address="offer.side0" full="true")
        v-card-text
          OfferDigestSide(:address="offer.side0" :assets="offer.side0Assets").digest-container
    v-col(lg="6" sm="12")
      v-card(
        :color="isSide1 ? 'amber lighten-5' : 'white'"
        elevation=1
      )
        v-card-title {{ isSide1 ? 'YOUR SIDE' : 'NOT YOUR SIDE' }}
        v-card-subtitle
          ContractLink(:address="offer.side1" full="true")
        v-card-text
          OfferDigestSide(:address="offer.side1" :assets="offer.side1Assets").digest-container
  v-row
    v-col
      slot(name="actions")
</template>

<script>
import { mapGetters } from 'vuex'
import ContractLink from './ContractLink'
import NFTLink from './NFTLink'
import OfferDigestSide from '@/components/OfferDigestSide'

export default {
  name: 'OfferDigest',
  props: ['offer'],
  components: {
    ContractLink,
    NFTLink,
    OfferDigestSide,
  },
  computed: {
    ...mapGetters('account', ['address']),
    isSide0 () {
      return this.offer.side0.toLowerCase() === this.address.toLowerCase()
    },
    isSide1 () {
      return this.offer.side1.toLowerCase() === this.address.toLowerCase()
    },
  },
}
</script>
<style scoped>
.digest-container {
  min-height: 300px;
}
</style>
