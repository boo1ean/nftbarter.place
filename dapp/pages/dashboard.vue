<template lang="pug">
v-container(fluid)
  v-row
    v-col(sm=12 lg="6")
      v-card
        v-card-title Dashboard
        v-card-text
          v-simple-table
            tr
              td
                b Contract address
              td.pl-4
                ContractLink(:address="contractAddress" :full="true")
            tr
              td
                b Contract balance
              td.pl-4 {{ contractBalance }}
              td.pl-4
                v-btn(@click="withdrawBalance") Withdraw balance
            tr
              td
                b Total offers
              td.pl-4 {{ totalOffers }}
            tr
              td
                b Offer Fee
              td.pl-4.py-1
                v-text-field(
                  dense
                  hide-details
                  v-model="offerFee"
                  solo
                )
              td.pl-4
                v-btn(
                  @click="setFee"
                ) Set fee
        v-card-actions
  ProgressIndicator(v-if="isLoading").mt-10
</template>
<script>
import contracts from '@/utils/contracts'
import ProgressIndicator from '@/components/ProgressIndicator'
import ContractLink from '@/components/ContractLink'
import Moralis from '@/utils/moralis'
export default {
  name: 'DashboardPage',
  middleware: 'owner',
  components: {
    ContractLink,
    ProgressIndicator,
  },
  head () {
    return {
      title: 'Owner Dashboard',
    }
  },
  data () {
    return {
      recentOfferId: -1,
      contractBalanceWei: 0,
      offerFee: 0,
      isLoading: false,
    }
  },
  mounted () {
    this.sync()
  },
  computed: {
    totalOffers () {
      return this.recentOfferId + 1
    },
    contractAddress () {
      return contracts.addresses().barter
    },
    contractBalance () {
      return Moralis.Units.FromWei(this.contractBalanceWei)
    },
  },
  methods: {
    async withdrawBalance () {
      this.isLoading = true
      const barterContract = await contracts.createBarterContract()
      const owner = await barterContract.methods.owner().call()
      try {
        await barterContract.methods.withdrawBalance(owner).send({
          from: owner,
        })
      } catch (e) {
        console.error('Withdraw balance error', e)
      }
      this.isLoading = false
    },
    async sync () {
      const web3 = await Moralis.enableWeb3()
      const barterContract = await contracts.createBarterContract()
      this.recentOfferId = +(await barterContract.methods.getRecentOfferId().call())
      this.contractBalanceWei = await web3.eth.getBalance(barterContract.options.address)
      this.offerFee = Moralis.Units.FromWei(await barterContract.methods.offerFee().call())
    },
    async setFee () {
      this.isLoading = true
      const offerFeeWei = Moralis.Units.ETH(this.offerFee)
      const barterContract = await contracts.createBarterContract()
      try {
        const owner = await barterContract.methods.owner().call()
        await barterContract.methods.setOfferFee(offerFeeWei).send({
          from: owner,
        })
        this.sync()
      } catch (e) {
        console.error('Set fee error', e)
      }
      this.isLoading = false
    },
  },
}
</script>
