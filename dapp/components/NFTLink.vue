<template lang="pug">
  a(
    target="_blank"
    :title="tokenId"
    :href="url"
  ) {{ shortId }}
</template>
<script>
export default {
  name: 'NFTLink',
  props: ['contract', 'tokenId'],
  computed: {
    url () {
      return this.$store.state.account.network.explorerURL + `/token/${this.contract}?a=${this.tokenId}`
    },
    shortId () {
      if (this.tokenId.length > 7) {
        return this.tokenId.slice(0, 7) + '..'
      }
      return this.tokenId
    },
  },
}
</script>
