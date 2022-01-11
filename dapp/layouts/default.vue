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
    img(v-if="!account.address" src="~/assets/logo-color.png" height=40 width=40 @click.stop="toggleDrawer").mr-4
    img(v-else-if="'bsc' === network.chain" src="~/assets/logo-bsc.png" height=40 width=40 @click.stop="toggleDrawer").mr-4
    img(v-else-if="'polygon' === network.chain" src="~/assets/logo-polygon.png" height=40 width=40 @click.stop="toggleDrawer").mr-4
    img(v-else-if="'eth' === network.chain" src="~/assets/logo-eth.png" height=40 width=40 @click.stop="toggleDrawer").mr-4
    img(v-else-if="'avalanche' === network.chain" src="~/assets/logo-avax.png" height=40 width=40 @click.stop="toggleDrawer").mr-4
    img(v-else-if="'ropsten' === network.chain" src="~/assets/logo-ropsten.png" height=40 width=40 @click.stop="toggleDrawer").mr-4
    v-toolbar-items.d-none.d-md-flex
      v-btn-toggle(borderless group dense).align-center
        v-btn(v-for="(item, i) in drawerItems" :key="i" :to="item.to" router nuxt)
          v-icon.mr-2 {{ item.icon }}
          | {{ item.title }}
          v-badge(
            v-if="item.offers && pendingOffers.length"
            inline
            tile
            :color="networkColor"
            :content="pendingOffers.length"
          )
    v-spacer
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
        v-list-item(v-for="(item, i) in drawerItems" :key="i" :to="item.to" router exact)
          v-list-item-action
            v-icon {{ item.icon }}
          v-list-item-content
            v-list-item-title
              span {{ item.title }}
              v-badge(
                v-if="item.offers && pendingOffers.length"
                tile
                :color="networkColor"
                :content="pendingOffers.length"
              ).ml-3
        v-list-item(v-if="isOwner" to="/dashboard" router exact)
          v-list-item-action
            v-icon mdi-chart-pie
          v-list-item-content
            v-list-item-title
              span Dashboard
  v-main
    nuxt
  v-footer(padless)
    v-card.flex(flat tile)
      v-card-text.py-2.text-center.d-flex.align-center.justify-center
        | {{ new Date().getFullYear() }} &mdash;&nbsp;
        span nftbarter.place |&nbsp;
        a(href="https://moralis.io/" target="_blank").text-decoration-none.mr-3 Built with Moralis
        a(icon link href="https://twitter.com/nftbarterplace" target="_blank")
          fa-icon(icon="fab fa-twitter").svg-icon.mr-2
        a(icon link href="https://t.me/nftbarterplace" target="_blank")
          fa-icon(icon="fab fa-telegram").svg-icon
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import Moralis from '@/utils/moralis'
export default {
  name: 'LayoutDefault',
  data () {
    return {
      drawerItems: [
        {
          title: 'Start Barter',
          icon: 'mdi-repeat',
          to: '/',
        },
        {
          title: 'My Offers',
          icon: 'mdi-view-list',
          to: '/offers',
          offers: true,
        },
        {
          title: 'FAQ',
          icon: 'mdi-help-circle',
          to: '/faq',
        },
      ],
      drawer: false,
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
    ...mapGetters('account', ['address', 'pendingOffers']),
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
    isOwner () {
      return this.$store.state.account.isOwner
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
    toggleDrawer () {
      if (this.address) {
        this.drawer = !this.drawer
      }
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
.svg-icon {
  height: 1.3rem;
  color: grey;
}
</style>
