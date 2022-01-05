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
        v-simple-table(dense).mt-5
          template(v-slot:default)
            thead
              tr
                th Token contract
                th Token id
            tbody
              tr(v-for="item in side0Assets")
                td
                  ContractLink(:address="item.contractAddress")
                td
                  NFTLink(:contract="item.contractAddress", :token-id="item.tokenId")
      v-col(cols="6")
        h2(v-if="isIncoming") You will give
        h2(v-else) You will get
        v-simple-table(dense).mt-5
          template(v-slot:default)
            thead
              tr
                th Token contract
                th Token id
            tbody
              tr(v-for="item in side1Assets")
                td
                  ContractLink(:address="item.contractAddress")
                td
                  NFTLink(:contract="item.contractAddress", :token-id="item.tokenId")
  v-card-actions
    v-btn(v-if="isIncoming" color="primary") Accept
    v-btn(v-else color="primary") Cancel
</template>

<script>
import { mapGetters } from 'vuex'
import ContractLink from './ContractLink'
import NFTLink from './NFTLink'

export default {
  name: 'OfferDigest',
  props: ['offer'],
  components: {
    ContractLink,
    NFTLink,
  },
  computed: {
    ...mapGetters('account', ['address']),
    isIncoming () {
      return this.offer.side1 === this.address
    },
    side0Assets () {
      console.log(this.offer)
      return this.offer.side0Assets
    },
    side1Assets () {
      return this.offer.side1Assets
    },
  },
}
</script>
