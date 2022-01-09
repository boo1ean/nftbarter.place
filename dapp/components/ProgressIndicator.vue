<template lang="pug">
.d-flex.justify-center.align-center
  v-progress-circular(
    :size="big ? 128 : 48"
    :width="big ? 12 : 5"
    :color="networkColor"
    indeterminate)
</template>
<script>
export default {
  name: 'ProgressIndicator',
  props: ['big'],
  computed: {
    networkColor () {
      return this.$store.getters['account/networkColor']
    },
  },
}
</script>
