<template lang="pug">
v-container(fluid v-if="isWalletConnected && offer")
  OfferDigest(:offer="offer")
.d-flex.justify-center.align-center.fill-height.flex-column(v-else-if="isWalletConnected && mismatchChain")
  v-alert(type="error") To see offer you need to change network to {{ requestedChain }}
  v-btn(color="primary" @click="changeNetwork") Change network
.d-flex.justify-center.align-center.fill-height(v-else-if="isWalletConnected && !offer")
  ProgressIndicator
.d-flex.justify-center.align-center.fill-height(v-else)
    v-alert(type="warning") Connect wallet to view offer
</template>
<script>
import ProgressIndicator from '@/components/ProgressIndicator'
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
  computed: {
    isWalletConnected () {
      return !!this.$store.state.account.address
    },
    requestedChain () {
      return this.$route.query.chain
    },
    mismatchChain () {
      return this.$route.query.chain !== this.$store.state.account.network.chain
    },
  },
  methods: {
    changeNetwork () {
      this.$store.dispatch('account/ensureChain', this.requestedChain)
    },
  },
}
</script>
