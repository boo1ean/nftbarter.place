<template lang="pug">
v-container
  v-row
    v-col(cols=12 md=6)
      h1.mb-4 Incoming offers
      v-row(v-if="incomingOffers.length")
        v-col(sm=12)
          OfferListItem(v-for="o in incomingOffers" :offer="o").mb-3
      v-row(v-else)
        v-col(sm=12) No incoming offers
    v-col(cols=12 md=6)
      h1.mb-4 Outgoing offers
      v-row(v-if="outgoingOffers.length")
        v-col(sm=12)
          OfferListItem(v-for="o in outgoingOffers" :offer="o").mb-3
      v-row(v-else)
        v-col(sm=12) No outgoing offers
</template>
<script>
import { mapState, mapGetters } from 'vuex'
import OfferListItem from '@/components/OfferListItem'
export default {
  name: 'OutgoingOffers',
  middleware: 'auth',
  head () {
    return {
      title: 'Outgoing Offers',
    }
  },
  components: {
    OfferListItem,
  },
  computed: {
    ...mapState('account', ['offers']),
    ...mapGetters('account', ['outgoingOffers', 'incomingOffers']),
  },
}
</script>
