<template lang="pug">
v-container(fluid v-if="isWalletConnected && offer")
  v-overlay(v-if="isLoading")
    v-alert(color="white" elevation=1)
      span.black-text {{ loadingMessage }}
      ProgressIndicator.my-4
  OfferDigest(:offer="offer")
    template(v-slot:actions)
      div(v-if="isOfferPending")
        v-btn(v-if="isSide0" @click="cancelOffer" color="error").mr-3 Cancel
        v-btn(v-if="isSide1" @click="acceptOffer" color="primary") Accept
      div(v-else)
        v-alert(:type="offerStatusAlertType") This offer is {{ offerStatus }}
.d-flex.justify-center.align-center.fill-height.flex-column(v-else-if="isWalletConnected && mismatchChain")
  v-alert(type="error") To see offer you need to change network to {{ requestedChain }}
  v-btn(color="primary" @click="changeNetwork") Change network
.d-flex.justify-center.align-center.fill-height(v-else-if="isWalletConnected && !offer")
  ProgressIndicator
.d-flex.justify-center.align-center.fill-height(v-else)
    v-alert(type="warning") Connect wallet to view offer
</template>
<script>
import { mapState } from 'vuex'
import ProgressIndicator from '@/components/ProgressIndicator'
import contracts from '@/utils/contracts'
export default {
  name: 'OfferDetails',
  middleware: 'auth',
  components: {
    ProgressIndicator,
  },
  data () {
    return {
      offer: null,
      isLoading: false,
      loadingMessage: 'Waiting for cancel transaction',
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
    isSide0 () {
      return this.offer.side0.toLowerCase() === this.currentUserAddress.toLowerCase()
    },
    isSide1 () {
      return this.offer.side1.toLowerCase() === this.currentUserAddress.toLowerCase()
    },
    currentUserAddress () {
      return this.$store.getters['account/address']
    },
    isOfferPending () {
      return this.offer && +this.offer.status === 0
    },
    offerStatus () {
      if (!this.offer) {
        return 'undefined'
      }
      const offerStatuses = [
        'Pending',
        'Cancelled',
        'Completed',
        'Rejected',
      ]
      return offerStatuses[this.offer.status]
    },
    offerStatusAlertType () {
      switch (this.offerStatus) {
        case 'Pending':
          return 'warning'
        case 'Completed':
          return 'success'
        default:
          return 'error'
      }
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
      const [offer] = await barterContract.methods.getOffersByIds([this.$route.params.id]).call()
      if (offer) {
        this.offer = offer
      }
    },
    async cancelOffer () {
      try {
        this.isLoading = true
        this.loadingMessage = 'Waiting for cancel transaction'
        const barterContract = await contracts.createBarterContract(this.requestedChain)
        await barterContract.methods.cancelOffer(this.offer.id).send({
          from: this.currentUserAddress,
        })
        this.$store.dispatch('account/sync')
        await this.fetchOffer()
      } catch (e) {
        console.error('Cancel offer error', e)
      }
      this.isLoading = false
    },
    async acceptOffer () {
      try {
        this.isLoading = true
        this.loadingMessage = 'Waiting for accept transaction'
        const barterContract = await contracts.createBarterContract(this.requestedChain)
        await barterContract.methods.acceptOffer(this.offer.id).send({
          from: this.currentUserAddress,
        })
        this.$store.dispatch('account/sync')
        await this.fetchOffer()
      } catch (e) {
        console.error('Accept offer error', e)
      }
      this.isLoading = false
    },
  },
}
</script>
<style scoped>
.black-text {
  color: black !important;
}
</style>
