<template lang="pug">
a(
  target="_blank"
  :title="address"
  href="http://example.com"
) {{ address | shortAddress }}
</template>

<script>
export default {
  name: 'ContractLink',
  props: ['address'],
  filters: {
    shortAddress (address) {
      return address.slice(0, 7) + '..'
    }
  },
}
</script>
