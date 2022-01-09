<template lang="pug">
v-container(fluid v-if="isWalletConnected && offer")
  OfferDigest(:offer="offer")
    template(v-slot:actions)
      v-btn(v-if="isIncoming" @click="acceptOffer" color="primary") Accept
      v-btn(v-else @click="cancelOffer" color="error") Cancel
.d-flex.justify-center.align-center.fill-height.flex-column(v-else-if="isWalletConnected && mismatchChain")
  v-alert(type="error") To see offer you need to change network to {{ requestedChain }}
  v-btn(color="primary" @click="changeNetwork") Change network
.d-flex.justify-center.align-center.fill-height(v-else-if="isWalletConnected && !offer")
  ProgressIndicator
.d-flex.justify-center.align-center.fill-height(v-else)
    v-alert(type="warning") Connect wallet to view offer
</template>
<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import ProgressIndicator from '@/components/ProgressIndicator'
import contracts from '@/utils/contracts'
export default {
  name: 'OfferDetails',
  components: {
    ProgressIndicator,
  },
  data () {
    return {
      offer: null,
    }
  },
  mounted () {
    this.fetchOffer()
  },
  watch: {
    'account.network' () {
      console.log('network changed')
      this.fetchOffer()
    },
  },
  computed: {
    ...mapState(['account']),
    isWalletConnected () {
      return !!this.currentUserAddress
    },
    requestedChain () {
      return this.$route.query.chain
    },
    mismatchChain () {
      const currentChain = this.$store.getters['account/chain']
      return this.$route.query.chain !== currentChain
    },
    isIncoming () {
      return this.offer.side1.toLowerCase() === this.currentUserAddress.toLowerCase()
    },
    currentUserAddress () {
      return this.$store.getters['account/address']
    },
  },
  methods: {
    changeNetwork () {
      this.$store.dispatch('account/ensureChain', this.requestedChain)
    },
    async fetchOffer () {
      if (this.mismatchChain) {
        return
      }
      const barterContract = await contracts.createBarterContract(this.requestedChain)
      // TODO change for updated contract
      const offers = await barterContract.methods.getOffers().call({ from: this.currentUserAddress })
      this.offer = _.find(offers, { id: this.$route.params.id })
    },
    async cancelOffer () {
      try {
        const barterContract = await contracts.createBarterContract(this.requestedChain)
        await barterContract.methods.cancelOffer(this.offer.id).send({
          from: this.currentUserAddress,
        })
      } catch (e) {
      }
    },
    acceptOffer () {
      console.log('accept')
    },
  },
}
</script>
