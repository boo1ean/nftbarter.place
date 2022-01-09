<template lang="pug">
v-container(fluid)
  v-row
    v-col(lg="6" sm="12")
      v-card(
        :color="isIncoming ? 'white lighten-5' : 'amber lighten-5'"
        elevation=1
      )
        v-card-title
          | {{ isIncoming ? 'NOT YOUR SIDE' : 'YOUR SIDE' }}
        v-card-text
          OfferDigestSide(:address="offer.side0" :assets="offer.side0Assets").digest-container
    v-col(lg="6" sm="12")
      v-card(
        :color="!isIncoming ? 'white lighten-5' : 'amber lighten-5'"
        elevation=1
      )
        v-card-title
          | {{ !isIncoming ? 'NOT YOUR SIDE' : 'YOUR SIDE' }}
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
    isIncoming () {
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
