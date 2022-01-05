<template lang="pug">
v-container(fluid)
  v-row
    v-col
      v-card
        v-card-title Incoming Offers
        v-card-text
          OfferDigest(v-for="o in incomingOffers" :offer="o")
  v-row
    v-col
      v-card
        v-card-title Outgoing offers
        v-card-text
          OfferDigest(v-for="o in incomingOffers" :offer="o")
</template>
<script>
import { mapState, mapGetters } from 'vuex'
import OfferDigest from '../components/OfferDigest'
export default {
  name: 'MyOffers',
  components: {
    OfferDigest,
  },
  computed: {
    ...mapState('account', ['offers']),
    ...mapGetters('account', ['incomingOffers', 'outgoingOffers']),
  },
}
</script>
