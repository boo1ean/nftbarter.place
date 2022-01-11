<template lang="pug">
v-container(fluid)
  h1.mb-4 Incoming offers
  v-row(v-if="incomingOffers.length")
    v-col(lg="6" sm="12")
      OfferListItem(v-for="o in incomingOffers" :offer="o").mb-3
  v-row(v-else)
    v-col(lg="6" sm="12") No incoming offers
</template>
<script>
import { mapState, mapGetters } from 'vuex'
import OfferListItem from '@/components/OfferListItem'
export default {
  name: 'IncomingOffers',
  middleware: 'auth',
  head () {
    return {
      title: 'Incoming Offers',
    }
  },
  components: {
    OfferListItem,
  },
  computed: {
    ...mapState('account', ['offers']),
    ...mapGetters('account', ['incomingOffers']),
  },
}
</script>
