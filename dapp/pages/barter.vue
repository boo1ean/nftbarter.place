<template lang="pug">
v-container(fluid)
  v-row
    v-col(cols="6")
      BarterSide(
        label="Your offer"
        :address="address")
      //v-card
      //  v-card-title Your offer
      //  v-card-subtitle
      //    v-text-field(
      //      :value="address"
      //      disabled
      //      append-icon="mdi-wallet"
      //      label="Your address"
      //      filled
      //      single-line
      //      hide-details
      //    ).mb-2
      //  v-card-text
      //    span(v-if="!offer.items.length") No items added yet..
      //    v-data-table(
      //      v-else
      //      dense
      //      fixed-header
      //      v-model="offer.dialogSelected"
      //      :headers="nftHeaders"
      //      :items="offer.items"
      //      :items-per-page="100"
      //      item-key="uniqueId"
      //      show-select)
      //      template(v-slot:item.token_id="{ item }")
      //        a(
      //          target="_blank"
      //          v-if="item.token_uri"
      //          :href="item.token_uri"
      //        ) {{ item.token_id | tokenIdShort }}
      //        span(v-else) {{ item.token_id | tokenIdShort }}
      //      template(v-slot:item.metadata="{ item }")
      //        NFTMetadata(:data="item.metadata")
      //  v-card-actions
      //    v-dialog(v-model="dialog" max-width=920)
      //      template(v-slot:activator="{ on, attrs }")
      //        v-btn(color="primary" v-bind="attrs" v-on="on" block) ADD
      //      v-card
      //        v-card-title.text-h5 Select items
      //        v-card-text
      //          v-row( v-if="account.isLoading")
      //            v-col(cols=12).ma-4
      //              v-progress-linear(
      //                color="deep-purple accent-4"
      //                indeterminate
      //                rounded
      //                height="6")
      //          v-data-table(
      //            v-else
      //            height="600"
      //            fixed-header
      //            v-model="offer.dialogSelected"
      //            :headers="nftHeaders"
      //            :items="offerNfts"
      //            :items-per-page="100"
      //            item-key="uniqueId"
      //            show-select)
      //            template(v-slot:top)
      //              v-text-field(
      //                v-model="offer.dialogFilterQuery"
      //                append-icon="mdi-magnify"
      //                label="Filter by id, name, attributes, etc.."
      //                filled
      //                single-line
      //                hide-details
      //              ).mb-2
      //            template(v-slot:item.token_id="{ item }")
      //              a(
      //                target="_blank"
      //                v-if="item.token_uri"
      //                :href="item.token_uri"
      //              ) {{ item.token_id | tokenIdShort }}
      //              span(v-else) {{ item.token_id | tokenIdShort }}
      //            template(v-slot:item.metadata="{ item }")
      //              NFTMetadata(:data="item.metadata")
      //        v-card-actions
      //          v-spacer
      //          v-btn(text @click="dialog = false") Cancel
      //          v-btn(color="primary" @click="addOfferNFTs()") Add
    v-col(cols="6")
      BarterSide(
        label="Your expectations"
      )
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import NFTMetadata from '../components/NFTMetadata'
import BarterSide from '../components/BarterSide'

export default {
  name: 'PageBarter',
  components: {
    NFTMetadata,
    BarterSide,
  },
  filters: {
    tokenIdShort (tokenId) {
      return tokenId.slice(0, 5)
    }
  },
  data () {
    return {
      offer: {
        items: [],
        dialogSelected: [],
        dialogFilterQuery: '',
      },
      expect: {
        items: []
      },
      nftHeaders: [
        { text: 'Token id', value: 'token_id' },
        { text: 'Type', value: 'contract_type' },
        { text: 'Collection', value: 'name' },
        { text: 'Metadata', value: 'metadata' }
      ],
      dialog: false
    }
  },
  computed: {
    ...mapState(['account']),
    ...mapGetters('account', ['address']),
    offerNfts () {
      return this.account.nfts
    },
  },
  mounted () {
    this.fetchAccountNFTS()
  },
  methods: {
    ...mapActions('account', ['fetchAccountNFTS']),
    addOfferNFTs () {
      this.offer.items = [...this.offer.items, ...this.offer.dialogSelected]
      this.offer.dialogSelected = []
      this.dialog = false
    }
  }
}
</script>
