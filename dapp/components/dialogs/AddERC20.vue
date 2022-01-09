<template lang="pug">
v-card(v-if="!address")
  v-card-title.d-flex.justify-center.align-center.mb-1
    | Enter participant address before adding
v-card(v-else-if="isLoading")
  v-card-title.d-flex.justify-center.align-center.mb-1
    ProgressIndicator.ma-4
v-card(v-else)
  v-card-title.text-h5 Add ERC20 tokens
  v-card-text
    v-card(elevation=1)
      v-card-text
        v-data-table(
          height="300"
          fixed-header
          :headers="headers"
          :items="filteredItems"
          hide-default-footer
          :items-per-page="500")
          template(v-slot:top)
            v-text-field(
              v-model="dialogFilterQuery"
              append-icon="mdi-magnify"
              label="Filter by id, name, attributes, etc.."
              filled
              single-line
              hide-details
            ).mb-2
          template(v-slot:item.symbol="{ item }")
            span(:title="item.symbol") {{ item.symbol | shortSymbol }}
          template(v-slot:item.token_address="{ item }")
            ContractLink(:address="item.token_address")
          template(v-slot:item.balance="{ item }")
            TokenBalance(:balance="item.balance" :decimals="item.decimals")
          template(v-slot:item.amount="{ item }")
            v-text-field(
              label="Amount"
              type="number"
              dense
              solo
              hide-details
              v-model="amounts[item.token_address]"
            )
    v-card(elevation=2).mt-4
      v-card-title Missing token? Add custom in form below
      v-card-text
        v-row
          v-col(cols=6)
            v-text-field(label="ERC20 Contract Address" v-model="customTokenAddress")
          v-col(cols=6)
            v-text-field(type="number" label="Amount" v-model="customTokenAmount")
  v-card-actions
    v-spacer
    v-btn(text @click="cancel") Cancel
    v-btn(color="primary" @click="save") Save
</template>
<script>
import _ from 'lodash'
import Moralis from '../../utils/moralis'
import NFTMetadata from '@/components/NFTMetadata'
import ContractLink from '@/components/ContractLink'
import TokenBalance from '@/components/TokenBalance'
import ProgressIndicator from '@/components/ProgressIndicator'

export default {
  name: 'AddERC20',
  props: ['address'],
  components: {
    NFTMetadata,
    ContractLink,
    TokenBalance,
    ProgressIndicator,
  },
  filters: {
    shortSymbol (sym) {
      if (sym.length > 6) {
        return sym.slice(0, 6) + '..'
      }
      return sym
    },
  },
  async mounted () {
    if (this.address) {
      console.log('Already have address')
      this.isLoading = true
      const options = {
        chain: this.$store.state.account.network.chain,
        address: this.address,
      }
      this.tokenBalances = await Moralis.Web3API.account.getTokenBalances(options)
      this.isLoading = false
      console.log(this.tokenBalances)
    }
  },
  data () {
    return {
      isLoading: false,
      dialogFilterQuery: '',
      amounts: {},
      tokenBalances: [],
      customTokenAddress: '',
      customTokenAmount: '',
      headers: [
        { text: 'Symbol', value: 'symbol' },
        { text: 'Contract Address', value: 'token_address' },
        { text: 'Balance', value: 'balance' },
        { text: 'Amount', value: 'amount' },
      ],
    }
  },
  watch: {
    address () {
      console.log('Address changed!')
    },
  },
  computed: {
    filteredItems () {
      if (this.dialogFilterQuery) {
        return this.tokenBalances.filter((item) => {
          return Object.values(item).join('').toLowerCase().includes(this.dialogFilterQuery)
        })
      }
      return this.tokenBalances
    },
  },
  methods: {
    cancel () {
      this.amounts = {}
      this.$emit('cancel')
    },
    async save () {
      const result = []
      for (const contractAddress in this.amounts) {
        const token = _.find(this.tokenBalances, { token_address: contractAddress })

        result.push({
          contractAddress,
          amount: this.amounts[contractAddress],
          decimals: token.decimals,
          symbol: token.symbol,
        })
      }

      if (this.customTokenAddress && this.customTokenAmount) {
        const options = {
          chain: this.$store.state.account.network.chain,
          addresses: this.customTokenAddress,
        }
        const [token] = await Moralis.Web3API.token.getTokenMetadata(options)
        result.push({
          contractAddress: this.customTokenAddress,
          amount: this.customTokenAmount,
          decimals: token.decimals,
          symbol: token.symbol,
        })
      }

      this.$emit('save', result)
      this.customTokenAddress = ''
      this.customTokenAmount = ''
      this.amounts = {}
    },
  },
}
</script>
