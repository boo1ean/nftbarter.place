<template lang="pug">
.d-flex.justify-center.align-center
  v-progress-circular(
    width=4
    :color="networkColor"
    indeterminate)
</template>
<script>
export default {
  name: 'ProgressIndicator',
  computed: {
    networkColor () {
      return this.$store.getters['account/networkColor']
    },
  },
}
</script>
