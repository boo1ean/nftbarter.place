<template lang="pug">
v-card(elevation=1)
  v-card-title {{ label }}
  v-card-subtitle
    v-text-field(
      v-model="dynamicAddress"
      :disabled="!!address || !isWalletConnected"
      append-icon="mdi-wallet"
      label="Participant address"
      filled
      single-line
      hide-details
      @input="validateAddress"
      :error="isAddressInvalid"
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
          @input="makeDirty"
        )
      template(v-slot:item.action="{ item }")
        v-btn(
          @click="removeERC20Asset(item)"
          text
          color="red"
          x-small) Remove
  v-card-actions
    v-row
      v-col(lg=2 sm=6)
        v-dialog(v-model="dialog" max-width=920)
          template(v-slot:activator="{ on, attrs }")
            v-btn(
              color="primary"
              v-bind="attrs"
              block
              v-on="on"
              :disabled="!hasValidAddress"
              @click="openAddNFTDialog()") Add NFT
          v-card(v-if="!dynamicAddress")
            v-card-title.d-flex.justify-center.align-center.mb-1
              | Enter participant address before adding
          v-card(v-else-if="isLoading")
            v-card-title.d-flex.justify-center.align-center.mb-1.flex-column
              span Loading NFTs..
              ProgressIndicator.ma-4
          v-card(v-else)
            v-card-title.text-h5 Select items
            v-card-text
              v-data-table(
                height="400"
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
      v-col(lg=2 sm=6).pl-0
        v-dialog(v-model="dialogERC20" max-width=920)
          template(v-slot:activator="{ on, attrs }")
            v-btn(
              block
              color="primary"
              v-bind="attrs"
              :disabled="!hasValidAddress"
              v-on="on") Add ERC20
          AddERC20(
            :address="dynamicAddress"
            @cancel="dialogERC20 = false"
            @save="addERC20"
          )
      v-col(offset-lg=5 lg=3 sm=12).d-flex.justify-end
        v-icon(v-if="confirmed" color="green").mr-2 mdi-check-circle
        v-btn(
          color="success"
          block
          :disabled="confirmed || !dynamicAddress || isAddressInvalid"
          @click="confirm") {{ confirmed ? 'Confirmed' : hasItems ? 'Confirm assets' : 'Confirm without assets' }}
</template>
<script>
import _ from 'lodash'
import Moralis from '../utils/moralis'
import NFTMetadata from '@/components/NFTMetadata'
import AddERC20 from '@/components/dialogs/AddERC20'
import ContractLink from '@/components/ContractLink'
import TokenBalance from '@/components/TokenBalance'
import ProgressIndicator from '@/components/ProgressIndicator'

export default {
  name: 'BarterSide',
  props: [
    'label',
    'address',
    'isCurrentUser',
  ],
  components: {
    NFTMetadata,
    AddERC20,
    TokenBalance,
    ContractLink,
    ProgressIndicator,
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
      isAddressInvalid: false,
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
    hasItems () {
      return this.selectedItems.length || this.erc20Assets.length
    },
    hasValidAddress () {
      return this.dynamicAddress && !this.isAddressInvalid
    },
    isWalletConnected () {
      return this.$store.getters['account/address']
    },
  },
  watch: {
    customAddress () {
      this.items = []
    },
    selectedItems () {
      this.makeDirty()
    },
  },
  methods: {
    async openAddNFTDialog () {
      if (!this.dynamicAddress) {
        this.dialog = false
        return
      }
      const options = {
        chain: this.$store.state.account.network.chain,
        address: this.dynamicAddress,
      }
      this.isLoading = true
      const nfts = await Moralis.Web3API.account.getNFTs(options)
      this.items = nfts.result.map(assignUniqueId)
      this.isLoading = false
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
          existingAsset.amount = asset.amount
        } else {
          this.erc20Assets.push(asset)
        }
      }
      this.erc20Assets = [...this.erc20Assets]
      this.makeDirty()
    },
    removeERC20Asset ({ contractAddress }) {
      _.remove(this.erc20Assets, { contractAddress })
      this.erc20Assets = [...this.erc20Assets]
      this.makeDirty()
    },
    makeDirty () {
      this.confirmed = false
      this.$emit('dirty')
    },
    validateAddress () {
      const web3Utils = new Moralis.Web3()
      this.isAddressInvalid = !web3Utils.utils.isAddress(this.dynamicAddress)
    },
  },
}

function assignUniqueId (nft) {
  nft.uniqueId = `${nft.token_address}-${nft.token_id}`
  return nft
}
</script>
