<template lang="pug">
span(v-if="noData") -
v-tooltip(v-else right)
  template(v-slot:activator="{ on, attrs }")
    v-icon(
      text
      v-bind="attrs"
      v-on="on") mdi-information
  v-container
    img(:src="image" :alt="name").metadata-image
    div(v-for="a in attrs") {{ `${a.trait_type}: ${a.value}` }}
</template>
<script>
export default {
  name: 'NFTMetadata',
  props: ['data'],
  data () {
    return {
      noData: true
    }
  },
  mounted () {
    try {
      const parsedData = JSON.parse(this.data)
      this.name = parsedData.name
      this.image = parsedData.image
      this.attrs = parsedData.attributes
      this.noData = false
    } catch (e) {

    }
  }
}
</script>
<style scoped>
.metadata-image {
  width: 150px;
  height: 150px;
}
</style>
