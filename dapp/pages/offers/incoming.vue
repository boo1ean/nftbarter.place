<template lang="pug">
v-container(fluid)
  h1.mb-4 Incoming Offers
  OfferDigest(v-for="o in incomingOffers" :offer="o").mb-4
</template>
<script>
import { mapState, mapGetters } from 'vuex'
import OfferDigest from '@/components/OfferDigest'
export default {
  name: 'IncomingOffers',
  components: {
    OfferDigest,
  },
  computed: {
    ...mapState('account', ['offers']),
    ...mapGetters('account', ['incomingOffers']),
  },
}
</script>
