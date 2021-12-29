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
            v-list-item-title Barter
  v-main
    nuxt
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
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
  computed: {
    ...mapState(['notifications', 'account']),
    ...mapGetters('account', ['address']),
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
</style>
