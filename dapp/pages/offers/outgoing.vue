<template lang="pug">
v-container(fluid)
  h1.mb-4 Outgoing offers
  OfferDigest(v-for="o in outgoingOffers" :offer="o").mb-4
</template>
<script>
import { mapState, mapGetters } from 'vuex'
import OfferDigest from '@/components/OfferDigest'
export default {
  name: 'OutgoingOffers',
  components: {
    OfferDigest,
  },
  computed: {
    ...mapState('account', ['offers']),
    ...mapGetters('account', ['outgoingOffers']),
  },
}
</script>
