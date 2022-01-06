<template lang="pug">
  a(
    _target="blank"
    href="http://example.com"
  ) {{ tokenId | shortId }}
</template>
<script>
export default {
  name: 'NFTLink',
  props: ['contract', 'tokenId'],
  filters: {
    shortId (address) {
      if (address.length > 7) {
        return address.slice(0, 7) + '..'
      }
      return address
    }
  },
}
</script>
