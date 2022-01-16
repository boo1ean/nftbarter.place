<template lang="pug">
v-container(v-if="isWalletConnected && offer")
  v-overlay(v-if="isLoading")
    v-alert(color="white" elevation=1)
      span.black-text {{ loadingText }}
      ProgressIndicator.my-4
  OfferDigest(:offer="offer")
    template(v-slot:actions)
      div(v-if="isOfferPending")
        v-alert(v-if="!isOfferExpired && formattedDeadline" type="warning").mb-2
          span This offer will expire at:&nbsp;
          b {{ formattedDeadline }}
        v-alert(v-if="isOfferExpired" type="error").mb-2
          span This offer is expired
        div(v-if="isSide1").mb-2.text--secondary Service fee: {{ acceptOfferFee }}
        v-btn(v-if="isSide0" @click="cancelOffer" color="error").mr-3 Cancel
        v-btn(v-if="isSide1" @click="approvePermissionsAndAccept" color="primary") Accept
      div(v-else)
        v-alert(:type="offerStatusAlertType") This offer is {{ offerStatus }}
.d-flex.justify-center.align-center.fill-height.flex-column(v-else-if="isWalletConnected && mismatchChain")
  v-alert(type="error")
    span To see offer you need to change network to&nbsp;
    b {{ requestedChainName }}
  v-btn(color="primary" @click="changeNetwork") Change network
.d-flex.justify-center.align-center.fill-height(v-else-if="isWalletConnected && !offer")
  ProgressIndicator
.d-flex.justify-center.align-center.fill-height(v-else)
    v-alert(type="warning") Connect wallet to view offer
</template>
<script>
import { mapState } from 'vuex'
import ProgressIndicator from '@/components/ProgressIndicator'
import contracts from '@/utils/contracts'
import { AssetType } from '@/utils/enums'
import { toBN } from '@/utils/utils'
import { getNetworkByAlias } from '@/utils/networks'

export default {
  name: 'OfferDetails',
  components: {
    ProgressIndicator,
  },
  head () {
    return {
      title: this.offer ? `Offer #${this.offer.id}` : 'Loading Offer..',
    }
  },
  data () {
    return {
      offer: null,
      isLoading: false,
      loadingText: 'Waiting for cancel transaction',
    }
  },
  mounted () {
    this.fetchOffer()
  },
  watch: {
    'account.network' () {
      setTimeout(() => this.fetchOffer(), 500)
    },
  },
  computed: {
    ...mapState(['account']),
    isWalletConnected () {
      return !!this.currentUserAddress
    },
    requestedChain () {
      return this.$route.query.chain
    },
    mismatchChain () {
      const currentChain = this.$store.getters['account/chain']
      return this.$route.query.chain !== currentChain
    },
    isSide0 () {
      return this.offer.side0.toLowerCase() === this.currentUserAddress.toLowerCase()
    },
    isSide1 () {
      return this.offer.side1.toLowerCase() === this.currentUserAddress.toLowerCase()
    },
    currentUserAddress () {
      return this.$store.getters['account/address']
    },
    isOfferPending () {
      return this.offer && +this.offer.status === 0
    },
    offerStatus () {
      if (!this.offer) {
        return 'undefined'
      }
      const offerStatuses = [
        'Pending',
        'Cancelled',
        'Completed',
        'Rejected',
      ]
      return offerStatuses[this.offer.status]
    },
    offerStatusAlertType () {
      switch (this.offerStatus) {
        case 'Pending':
          return 'warning'
        case 'Completed':
          return 'success'
        default:
          return 'error'
      }
    },
    acceptOfferFee () {
      return this.$store.state.account.fees.acceptOfferFee
    },
    formattedDeadline () {
      if (+this.offer.deadline > 0) {
        return new Date(this.offer.deadline * 1000).toLocaleString()
      }
      return ''
    },
    isOfferExpired () {
      return +this.offer.deadline > 0 && ((new Date().getTime()) > (new Date(this.offer.deadline * 1000).getTime()))
    },
    requestedChainName () {
      const network = getNetworkByAlias(this.requestedChain)
      console.log(network)
      return network.name
    },
  },
  methods: {
    changeNetwork () {
      this.$store.dispatch('account/ensureChain', this.requestedChain)
    },
    async fetchOffer () {
      if (this.mismatchChain) {
        return
      }
      const barterContract = await contracts.createBarterContract(this.requestedChain)
      const [offer] = await barterContract.methods.getOffersByIds([this.$route.params.id]).call()
      if (offer) {
        this.offer = offer
      }
    },
    async cancelOffer () {
      try {
        this.isLoading = true
        this.loadingText = 'Waiting for cancel transaction'
        const barterContract = await contracts.createBarterContract(this.requestedChain)
        await barterContract.methods.cancelOffer(this.offer.id).send({
          from: this.currentUserAddress,
        })
        this.$store.dispatch('account/sync')
        await this.fetchOffer()
      } catch (e) {
        console.error('Cancel offer error', e)
      }
      this.isLoading = false
    },
    async acceptOffer () {
      try {
        this.isLoading = true
        this.loadingText = 'Waiting for accept transaction'
        const barterContract = await contracts.createBarterContract()
        const options = {
          from: this.currentUserAddress,
          value: await barterContract.methods.acceptOfferFee().call(),
        }
        await barterContract.methods.acceptOffer(this.offer.id).send(options)
        this.$store.dispatch('account/sync')
        await this.fetchOffer()
      } catch (e) {
        console.error('Accept offer error', e)
      }
      this.isLoading = false
    },
    async approvePermissionsAndAccept () {
      const barterContractAddress = this.$store.getters['account/barterContractAddress']
      let didGetAllApprovals = true
      const usedNftAddresses = {}
      for (const asset of this.offer.side1Assets) {
        this.isLoading = true
        try {
          switch (+asset.assetType) {
            case AssetType.erc721: {
              if (usedNftAddresses[asset.contractAddress]) {
                continue
              }
              const contract = await contracts.createERC721(asset.contractAddress)
              const hasApproval = await contract.methods.isApprovedForAll(this.offer.side1, barterContractAddress).call({ from: this.offer.side1 })
              if (!hasApproval) {
                this.loadingText = 'Waiting for ERC721 approval transaction to complete'
                await contract.methods.setApprovalForAll(barterContractAddress, true).send({ from: this.offer.side1 })
              }
              usedNftAddresses[asset.contractAddress] = true
              break
            }
            case AssetType.erc20: {
              const contract = await contracts.createERC20(asset.contractAddress)
              const allowance = await contract.methods.allowance(this.offer.side1, barterContractAddress).call({ from: this.offer.side1 })
              if (toBN(allowance).cmp(toBN(asset.amount)) === -1 || confirm('You already have allowance, need more?')) {
                this.loadingText = 'Waiting for ERC20 approval transaction to complete'
                await contract.methods.approve(barterContractAddress, toBN(asset.amount)).send({ from: this.offer.side1 })
              }
              break
            }
            default:
              didGetAllApprovals = false
              window.alert('Something went wrong')
          }
        } catch (e) {
          console.log('Approval failed', e)
          didGetAllApprovals = false
        }
        this.isLoading = false
      }
      if (didGetAllApprovals) {
        this.fetchOffer()
        this.acceptOffer()
      } else {
        this.isLoading = false
        this.fetchOffer()
        alert('Sorry, there are some issues with your approvals, please try again')
      }
    },
  },
}
</script>
<style scoped>
.black-text {
  color: black !important;
}
</style>
