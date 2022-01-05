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
  v-app-bar(app clipped-left)
    v-toolbar-title(class="ml-0 pl-4")
      v-app-bar-nav-icon(@click.stop="drawer = !drawer")
    v-spacer
    v-btn(v-if="!account.user" text @click.stop="login()") Connect wallet
    v-btn(v-else text) {{ address | addressShort }}
  v-navigation-drawer(v-model="drawer" app clipped)
    div.d-flex.flex-column.justify-space-between.nav-wrapper
      v-list
        v-list-item(to="/barter" router exact)
          v-list-item-action
            v-icon mdi-repeat
          v-list-item-content
            v-list-item-title Create Barter Offer
        v-list-item(to="/offers" router exact)
          v-list-item-action
            v-icon mdi-tag
          v-list-item-content
            v-list-item-title
              span My Offers
              div.offers-label(v-if="outgoingOffers.length") Outgoing: {{ outgoingOffers.length }}
              div.offers-label(v-if="incomingOffers.length") Incoming: {{ incomingOffers.length }}
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
      drawer: true
    }
  },
  filters: {
    addressShort (address) {
      return address.slice(0, 6) + '...'
    }
  },
  mounted () {
    this.$store.dispatch('account/fetchAccountOffers')
    Moralis.onAccountsChanged((accounts) => {
      confirm('Link this address to your account?')
      // if (confirmed) {
      //   await Moralis.link(accounts[0])
      // }
    })
    Moralis.onConnect(() => {
      console.log('ON CONNECT')
    })
    Moralis.onDisconnect(() => {
      console.log('ON DISCONNECT')
    })
    Moralis.onChainChanged(() => {
      console.log('ON CHAIN CHANGED')
    })
  },
  computed: {
    ...mapState(['notifications', 'account']),
    ...mapGetters('account', ['address', 'incomingOffers', 'outgoingOffers']),
    isNotificationVisible: {
      get () {
        return this.notifications.isNotificationVisible
      },
      set (val) {
        this.setVisibility(val)
      }
    }
  },
  methods: {
    ...mapActions('notifications', ['setVisibility']),
    ...mapActions('account', ['login'])
  }
}
</script>

<style scoped>
.nav-wrapper {
  height: 100%;
}
.offers-label {
  font-size: 0.8rem;
}
</style>
