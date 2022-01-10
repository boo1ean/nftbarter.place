<template lang="pug">
v-app
  v-snackbar(
    v-model="isNotificationVisible"
    :color="notifications.color"
    :bottom="true"
    :right="true"
    :timeout=3000
  )
    | {{ notifications.notificationText }}
    v-btn(text @click="isNotificationVisible = false") Закрыть
  v-app-bar(
    app
    clipped-left
    elevation="1"
  )
    v-toolbar-title(class="ml-0")
      v-app-bar-nav-icon(v-if="address" @click.stop="drawer = !drawer")
      span nftbarter.place
    v-spacer
    //v-btn(
    //  icon
    //  @click="refresh"
    //  v-if="address"
    //)
    //  v-icon mdi-refresh
    .network.mx-2
      v-select(
        v-if="address"
        dense
        :items="account.networks"
        label="Network"
        solo
        hide-details
        item-text="name"
        item-value="chainId"
        return-object
        v-model="network"
        :loading="isNetworkLoading"
      )
    v-btn(v-if="!account.address" text @click.stop="connectWallet") Connect with metamask
    v-btn(
      v-else
      :color="networkColor"
      :class="{ 'white--text': network.chain !== 'bsc' }"
      link
      target="_blank"
      :href="`${network.explorerURL}/address/${address}`"
    ) {{ address | addressShort }}
  v-navigation-drawer(v-if="address" v-model="drawer" app clipped)
    div.d-flex.flex-column.justify-space-between.nav-wrapper
      v-list
        v-list-item(to="/" router exact)
          v-list-item-action
            v-icon mdi-repeat
          v-list-item-content
            v-list-item-title Create Barter Offer
        v-list-item(to="/offers/incoming" router exact)
          v-list-item-action
            v-icon mdi-undo
          v-list-item-content
            v-list-item-title
              span Incoming Offers
              v-badge(
                v-if="incomingOffers.length"
                color="green"
                :content="incomingOffers.length"
              ).ml-3
        v-list-item(to="/offers/Outgoing" router exact)
          v-list-item-action
            v-icon mdi-redo
          v-list-item-content
            v-list-item-title
              span Outgoing Offers
              v-badge(
                v-if="outgoingOffers.length"
                color="green"
                :content="outgoingOffers.length"
              ).ml-3
  v-main
    nuxt
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import Moralis from '@/utils/moralis'
export default {
  name: 'LayoutDefault',
  data () {
    return {
      drawer: true,
      selectedNetwork: null,
      isNetworkLoading: true,
    }
  },
  filters: {
    addressShort (address) {
      return address.slice(0, 6) + '...'
    },
  },
  watch: {
    'account.network' () {
      this.selectedNetwork = this.account.network
      this.isNetworkLoading = false
    },
  },
  // watch: {
  //   selectedNetwork (oldVal, newVal) {
  //     console.log('Watching you boi', oldVal.chainId, newVal.chainId)
  //     if (oldVal.chainId !== newVal.chainId) {
  //       this.selectedNetwork = { chainId: 56 }
  //     }
  //   }
  // },
  mounted () {
    this.$store.dispatch('account/sync')

    Moralis.onAccountsChanged(async (accounts) => {
      await this.$store.dispatch('account/sync')
    })
    // Moralis.onConnect(() => {
    //   this.$store.dispatch('account/sync')
    // })
    // Moralis.onDisconnect(() => {
    //   console.log('disconnect')
    // })
    Moralis.onChainChanged(() => {
      this.$store.dispatch('account/sync')
    })
  },
  computed: {
    ...mapState(['notifications', 'account']),
    ...mapGetters('account', ['address', 'incomingOffers', 'outgoingOffers']),
    network: {
      get () {
        return this.selectedNetwork
      },
      async set (val) {
        try {
          this.isNetworkLoading = true
          await Moralis.switchNetwork('0x' + val.chainId.toString(16))
          this.isNetworkLoading = false
          this.selectedNetwork = val
          this.$store.dispatch('account/setNetwork', val)
        } catch (e) {
          this.isNetworkLoading = false
          this.selectedNetwork = { ...this.account.network }
        }
      },
    },
    networkColor () {
      return this.$store.getters['account/networkColor']
    },
    isNotificationVisible: {
      get () {
        return this.notifications.isNotificationVisible
      },
      set (val) {
        this.setVisibility(val)
      },
    },
  },
  methods: {
    ...mapActions('notifications', ['setVisibility']),
    ...mapActions('account', ['login']),
    refresh () {
      this.$store.dispatch('account/fetchAccountOffers')
    },
    connectWallet () {
      this.$store.dispatch('account/login')
    },
  },
}
</script>

<style>
.nav-wrapper {
  height: 100%;
}
.network {
  width: 200px
}
</style>
