<template lang="pug">
v-card
  v-card-title {{ label }}
  v-card-subtitle
    v-text-field(
      v-model="dynamicAddress"
      :disabled="!!address"
      append-icon="mdi-wallet"
      label="Participant address"
      filled
      single-line
      hide-details
    ).mb-2
  v-card-text
    span(v-if="!selectedItems.length") No items added yet..
    v-data-table(
      v-else
      dense
      fixed-header
      v-model="selectedItems"
      :headers="nftHeaders"
      :items="selectedItems"
      :items-per-page="100"
      item-key="uniqueId"
      show-select)
      template(v-slot:item.token_id="{ item }")
        a(
          target="_blank"
          v-if="item.token_uri"
          :href="item.token_uri"
        ) {{ item.token_id | tokenIdShort }}
        span(v-else) {{ item.token_id | tokenIdShort }}
      template(v-slot:item.metadata="{ item }")
        NFTMetadata(:data="item.metadata")
  v-card-actions
    v-dialog(v-model="dialog" max-width=920)
      template(v-slot:activator="{ on, attrs }")
        v-btn(
          color="primary"
          v-bind="attrs"
          v-on="on"
          @click="openDialog()") Add NFT
      v-card(v-if="!dynamicAddress")
        v-card-title.d-flex.justify-center.align-center.mb-1
          | Enter participant address before adding
      v-card(v-else-if="isLoading")
        v-card-title.d-flex.justify-center.align-center.mb-1
          v-progress-circular(
            width=6
            color="deep-purple accent-4"
            indeterminate).ma-4
      v-card(v-else)
        v-card-title.text-h5 Select items
        v-card-text
          v-data-table(
            height="600"
            fixed-header
            v-model="selectedItems"
            :headers="nftHeaders"
            :items="filteredItems"
            :items-per-page="100"
            item-key="uniqueId"
            show-select)
            template(v-slot:top)
              v-text-field(
                v-model="dialogFilterQuery"
                append-icon="mdi-magnify"
                label="Filter by id, name, attributes, etc.."
                filled
                single-line
                hide-details
              ).mb-2
            template(v-slot:item.token_id="{ item }")
              a(
                target="_blank"
                v-if="item.token_uri"
                :href="item.token_uri"
              ) {{ item.token_id | tokenIdShort }}
              span(v-else) {{ item.token_id | tokenIdShort }}
            template(v-slot:item.metadata="{ item }")
              NFTMetadata(:data="item.metadata")
        v-card-actions
          v-spacer
          v-btn(text @click="dialog = false") Cancel
          v-btn(color="primary" @click="dialog = false") Add
    v-dialog(v-model="dialog" max-width=920)
      template(v-slot:activator="{ on, attrs }")
        v-btn(
          color="primary"
          v-bind="attrs"
          v-on="on"
          @click="openDialog()").ml-2 Add ERC20
      v-card(v-if="!dynamicAddress")
        v-card-title.d-flex.justify-center.align-center.mb-1
          | Enter participant address before adding
      v-card(v-else-if="isLoading")
        v-card-title.d-flex.justify-center.align-center.mb-1
          v-progress-circular(
            width=6
            color="deep-purple accent-4"
            indeterminate).ma-4
      v-card(v-else)
        v-card-title.text-h5 Select items
        v-card-text
          v-data-table(
            height="600"
            fixed-header
            v-model="selectedItems"
            :headers="nftHeaders"
            :items="filteredItems"
            :items-per-page="100"
            item-key="uniqueId"
            show-select)
            template(v-slot:top)
              v-text-field(
                v-model="dialogFilterQuery"
                append-icon="mdi-magnify"
                label="Filter by id, name, attributes, etc.."
                filled
                single-line
                hide-details
              ).mb-2
            template(v-slot:item.token_id="{ item }")
              a(
                target="_blank"
                v-if="item.token_uri"
                :href="item.token_uri"
              ) {{ item.token_id | tokenIdShort }}
              span(v-else) {{ item.token_id | tokenIdShort }}
            template(v-slot:item.metadata="{ item }")
              NFTMetadata(:data="item.metadata")
        v-card-actions
          v-spacer
          v-btn(text @click="dialog = false") Cancel
          v-btn(color="primary" @click="dialog = false") Add
    v-spacer
    v-icon(v-if="confirmed" color="green").mr-2 mdi-check-circle
    v-btn(
      color="success"
      :disabled="confirmed || !dynamicAddress"
      @click="confirm()") {{ confirmed ? 'Confirmed' : selectedItems.length ? 'Confirm items' : 'Confirm without items' }}
</template>
<script>
import Moralis from '../utils/moralis'
import NFTMetadata from '@/components/NFTMetadata'

export default {
  name: 'BarterSide',
  props: [
    'label',
    'address',
  ],
  components: {
    NFTMetadata,
  },
  filters: {
    tokenIdShort (tokenId) {
      return tokenId.slice(0, 5)
    }
  },
  data () {
    return {
      isLoading: true,
      selectedItems: [],
      items: [],
      customAddress: '',
      dialogFilterQuery: '',
      nftHeaders: [
        { text: 'Token id', value: 'token_id' },
        { text: 'Type', value: 'contract_type' },
        { text: 'Collection', value: 'name' },
        { text: 'Metadata', value: 'metadata' }
      ],
      dialog: false,
      confirmed: false,
    }
  },
  computed: {
    dynamicAddress: {
      get () {
        return this.address || this.customAddress
      },
      set (value) {
        this.customAddress = value
      },
    },
    filteredItems () {
      if (this.dialogFilterQuery) {
        return this.items.filter((item) => {
          return Object.values(item).join('').toLowerCase().includes(this.dialogFilterQuery)
        })
      }
      return this.items
    }
  },
  watch: {
    customAddress () {
      this.items = []
      this.selectedItems = []
    },
    selectedItems () {
      this.confirmed = false
    },
  },
  methods: {
    async openDialog () {
      if (!this.dynamicAddress) {
        this.dialog = false
        return
      }
      if (!this.items.length) {
        const options = {
          chain: this.$store.state.account.chain,
          address: this.dynamicAddress
        }
        this.isLoading = true
        const nfts = await Moralis.Web3API.account.getNFTs(options)
        this.items = nfts.result.map(assignUniqueId)
        this.isLoading = false
      }
    },
    confirm () {
      this.$emit('confirm', {
        address: this.dynamicAddress,
        selectedItems: this.selectedItems,
      })
      this.confirmed = true
    }
  },
}

function assignUniqueId (nft) {
  nft.uniqueId = `${nft.token_address}-${nft.token_id}`
  return nft
}
</script>
