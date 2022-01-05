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
      return address.slice(0, 7)
    }
  },
}
</script>
