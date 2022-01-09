<template lang="pug">
a(
  target="_blank"
  :title="address"
  :href="url"
) {{ full ? address : shortAddress }}
</template>

<script>
export default {
  name: 'ContractLink',
  props: ['address', 'full'],
  computed: {
    url () {
      return this.$store.state.account.network.explorerURL + '/address/' + this.address
    },
    shortAddress () {
      return this.address.slice(0, 7) + '..'
    },
  },
}
</script>
