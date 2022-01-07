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
    span(v-if="!selectedItems.length && !erc20Assets.length") No items added yet..
    v-data-table(
      v-if="selectedItems.length"
      dense
      v-model="selectedItems"
      :headers="nftHeaders"
      :items="selectedItems"
      :items-per-page="500"
      item-key="uniqueId"
      disable-sort
      hide-default-footer
      show-select).mb-4
      template(v-slot:top)
        h3 NFTs
      template(v-slot:item.token_id="{ item }")
        NFTLink(:contract="item.token_address" :token-id="item.token_id")
      template(v-slot:item.metadata="{ item }")
        NFTMetadata(:data="item.metadata")
    v-data-table(
      v-if="erc20Assets.length"
      :headers="erc20Headers"
      :items="erc20Assets"
      disable-sort
      hide-default-footer
      :items-per-page="500")
      template(v-slot:top)
        h3 ERC20 Tokens
      template(v-slot:item.symbol="{ item }")
        span(:title="item.symbol") {{ item.symbol | shortSymbol }}
      template(v-slot:item.contractAddress="{ item }")
        ContractLink(:address="item.contractAddress")
      template(v-slot:item.amount="{ item }")
        v-text-field(
          label="Amount"
          type="number"
          dense
          hide-details
          solo
          v-model="item.amount"
        )
      template(v-slot:item.action="{ item }")
        v-btn(
          @click="removeERC20Asset(item)"
          text
          color="red"
          x-small) Remove
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
            hide-default-footer
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
              NFTLink(:contract="item.token_address" :token-id="item.token_id")
            template(v-slot:item.metadata="{ item }")
              NFTMetadata(:data="item.metadata")
        v-card-actions
          v-spacer
          v-btn(text @click="dialog = false") Cancel
          v-btn(color="primary" @click="dialog = false") Add
    v-dialog(v-model="dialogERC20" max-width=920)
      template(v-slot:activator="{ on, attrs }")
        v-btn(
          color="primary"
          v-bind="attrs"
          v-on="on").ml-2 Add ERC20
      AddERC20(
        :address="dynamicAddress"
        @cancel="dialogERC20 = false"
        @save="addERC20"
      )
    v-spacer
    v-icon(v-if="confirmed" color="green").mr-2 mdi-check-circle
    v-btn(
      color="success"
      :disabled="confirmed || !dynamicAddress"
      @click="confirm") {{ confirmed ? 'Confirmed' : selectedItems.length ? 'Confirm items' : 'Confirm without items' }}
</template>
<script>
import _ from 'lodash'
import Moralis from '../utils/moralis'
import NFTMetadata from '@/components/NFTMetadata'
import AddERC20 from '@/components/dialogs/AddERC20'
import ContractLink from '@/components/ContractLink'
import TokenBalance from '@/components/TokenBalance'

export default {
  name: 'BarterSide',
  props: [
    'label',
    'address',
  ],
  components: {
    NFTMetadata,
    AddERC20,
    TokenBalance,
    ContractLink,
  },
  filters: {
    tokenIdShort (tokenId) {
      return tokenId.slice(0, 5)
    },
    shortSymbol (sym) {
      if (sym && sym.length > 6) {
        return sym.slice(0, 6) + '..'
      }
      return sym
    },
  },
  data () {
    return {
      isLoading: true,
      selectedItems: [],
      items: [],
      customAddress: '',
      dialogFilterQuery: '',
      nftHeaders: [
        { text: 'Token', value: 'token_id' },
        { text: 'Type', value: 'contract_type' },
        { text: 'Collection', value: 'name' },
        { text: 'Metadata', value: 'metadata' },
      ],
      erc20Headers: [
        { text: 'Name', value: 'symbol' },
        { text: 'Address', value: 'contractAddress' },
        { text: 'Amount', value: 'amount' },
        { text: '', value: 'action' },
      ],
      erc20Assets: [],
      dialog: false,
      dialogERC20: false,
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
    },
  },
  watch: {
    customAddress () {
      this.items = []
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
          chain: this.$store.state.account.network.chain,
          address: this.dynamicAddress,
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
        erc20Assets: this.erc20Assets,
      })
      this.confirmed = true
    },
    addERC20 (erc20Assets) {
      this.dialogERC20 = false
      for (const asset of erc20Assets) {
        const existingAsset = _.find(this.erc20Assets, { contractAddress: asset.contractAddress })
        if (existingAsset) {
          existingAsset.amount += asset.amount
        } else {
          this.erc20Assets.push(asset)
        }
      }
      this.erc20Assets = [...this.erc20Assets]
      this.confirmed = false
    },
    removeERC20Asset ({ contractAddress }) {
      _.remove(this.erc20Assets, { contractAddress })
      this.erc20Assets = [...this.erc20Assets]
    },
  },
}

function assignUniqueId (nft) {
  nft.uniqueId = `${nft.token_address}-${nft.token_id}`
  return nft
}
</script>
