<template lang="pug">
v-card(elevation=2)
  v-card-title
    span Offer \#{{ offer.id }}&nbsp;
    span(v-if="isIncoming") from {{ offer.side0 }}
    span(v-else) to {{ offer.side1 }}
  v-card-text
    v-row
      v-col(cols="6")
        h2(v-if="isIncoming") You will get
        h2(v-else) You will give
        OfferSideDigest(:address="offer.side0" :assets="offer.side0Assets")
      v-col(cols="6")
        h2(v-if="isIncoming") You will give
        h2(v-else) You will get
        OfferSideDigest(:address="offer.side1" :assets="offer.side1Assets")
  v-card-actions
    v-btn(v-if="isIncoming" @click="accept" color="primary") Accept
    v-btn(v-else @click="cancel" color="error") Cancel
</template>

<script>
import { mapGetters } from 'vuex'
import ContractLink from './ContractLink'
import NFTLink from './NFTLink'
import OfferSideDigest from '@/components/OfferSideDigest'
import getBarterContract from '@/utils/barterContract'

export default {
  name: 'OfferDigest',
  props: ['offer'],
  components: {
    ContractLink,
    NFTLink,
    OfferSideDigest,
  },
  computed: {
    ...mapGetters('account', ['address']),
    isIncoming () {
      return this.offer.side1.toLowerCase() === this.address.toLowerCase()
    },
  },
  methods: {
    async cancel () {
      const contract = await getBarterContract()
      await contract.methods.cancelOffer(this.offer.id).send({
        from: this.address,
      })
    },
    accept () {
      console.log('accept')
    },
  },
}
</script>
