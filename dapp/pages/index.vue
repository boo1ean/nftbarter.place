<template lang="pug">
v-container
  v-alert(
    v-if="!isWalletConnected"
    elevation=1
    color="blue-grey lighten-2"
  ).py-6.mb-4.d-flex.justify-center.align-center.flex-column.hello.text-center
    div
      span.hello Welcome to&nbsp;
      b.hello nftbarter.place
    div.hello Please connect your wallet to proceed
    v-btn(
      x-large
      @click.stop="connectWallet"
    ).mt-3 CONNECT WITH METAMASK
  v-alert(
    v-else-if="!isReadyToRumble"
    elevation=1
    color="red"
  ).py-6.mb-4.d-flex.justify-center.align-center.flex-column.hello
    div
      span.hello This chain is not supported (yet)
  v-overlay(:value="isLoading")
    v-alert(color="white")
      span.black-text {{ loadingText }}
      ProgressIndicator.my-4
  OfferDigest(v-if="pendingOffer" :offer="pendingOffer")
  v-row(v-show="offerState === 0").flex-grow-0
    v-col(sm=12 lg=6)
      BarterSide(
        label="YOU GIVE"
        :address="address"
        @confirm="confirmSide0"
        @dirty="makeSide0Dirty"
      )
    v-col(sm=12 lg=6)
      BarterSide(
        label="YOU GET"
        @confirm="confirmSide1"
        @dirty="makeSide1Dirty"
      )
  v-row.flex-grow-0.my-md-10.pb-10
    v-col(
      lg=6 offset-lg=3
      sm=12
    )
      v-card
        v-card-title Creating barter offer
        v-card-subtitle.pb-0
          div {{ stepInstruction }}
          div(v-if="createOfferFee").text--secondary Service fee: {{ createOfferFee }}
        v-card-text.pb-0.mt-2
          .d-flex.mb-2
            v-checkbox(
              label="Has deadline"
              v-model="hasDeadline"
              hide-details
            ).mt-1
            v-text-field(
              v-model="deadlineValue"
              v-if="hasDeadline"
              type="number"
              label="Days"
              hide-details
              solo
              dense
            ).flex-grow-0.ml-4.deadline-value
            v-select(
              v-if="hasDeadline"
              v-model="deadlineUnitsType"
              :items="deadlineUnits"
              item-text="label"
              return-object
              dense
              hide-details
              solo
            ).flex-grow-0.ml-4.deadline-units
          div(v-if="hasDeadline")
            b Offer expires:&nbsp;
            span {{ deadlineTimestampFormatted }}
          v-stepper(
            elevation=0
            v-model="offerState"
          )
            v-stepper-header
              v-stepper-step(:complete='offerState > 0' step='0').pl-0 Select Assets
              v-divider
              v-stepper-step(:complete='offerState > 1' step='1') Preview
              v-divider
              v-stepper-step(:complete='offerState > 2' step='2') Approve permissions
              v-divider
              v-stepper-step(step='3').pr-0 Create offer
        v-card-actions.d-flex
          v-btn(
            v-if="offerState > 0"
            @click="backBarter")
              v-icon mdi-keyboard-backspace
              | &nbsp;Back
          v-btn(
            color="success"
            @click="continueBarter"
            :disabled="!side0 || !side1"
          ).flex-grow-1 {{ continueText }}
</template>

<style scoped>
.hello {
  color: white;
  font-size: 2rem;
}
.black-text {
  color: black !important;
}
.height-100 {
  height: 100%;
}
.deadline-value {
  max-width: 120px;
}
.deadline-units {
  max-width: 120px;
}
</style>

<script>
import _ from 'lodash'
import { mapState, mapGetters } from 'vuex'
import Moralis from 'moralis'
import NFTMetadata from '../components/NFTMetadata'
import BarterSide from '../components/BarterSide'
import contracts from '@/utils/contracts'
import { AssetType } from '@/utils/enums'
import { toBN } from '@/utils/utils'

const OfferState = {
  Initial: 0,
  Preview: 1,
  Approvals: 2,
  Creating: 3,
}

const ContinueTexts = {
  [OfferState.Initial]: 'Continue',
  [OfferState.Preview]: 'Approve permissions',
  [OfferState.Approvals]: 'Approve permissions',
  [OfferState.Creating]: 'Create offer',
}

const PageTitles = {
  [OfferState.Initial]: 'Create Offer',
  [OfferState.Preview]: 'Create Offer | Preview',
  [OfferState.Approvals]: 'Create Offer | Approvals',
  [OfferState.Creating]: 'Create Offer | Almost Completed',
}

const Instructions = {
  [OfferState.Initial]: 'Specify counterparty address and select assets for each side',
  [OfferState.Preview]: 'Make sure everything is correct and proceed to approvals',
  [OfferState.Approvals]: 'Allow barter contract to move selected assets',
  [OfferState.Creating]: 'Seems good? Hit the create offer button',
}

export default {
  name: 'PageBarter',
  components: {
    NFTMetadata,
    BarterSide,
  },
  head () {
    return {
      title: this.pageTitle,
    }
  },
  filters: {
    tokenIdShort (tokenId) {
      return tokenId.slice(0, 5)
    },
  },
  data () {
    return {
      offerState: OfferState.Initial,
      side0: null,
      side1: null,
      pendingOffer: null,
      isLoading: false,
      loadingText: 'Waiting for transaction to complete',
      hasDeadline: false,
      deadlineValue: 7,
      deadlineUnitsType: { label: 'days', value: 60 * 60 * 24 },
      deadlineUnits: [
        { label: 'days', value: 60 * 60 * 24 },
        { label: 'hours', value: 60 * 60 },
        { label: 'minutes', value: 60 },
      ],
    }
  },
  computed: {
    ...mapState(['account']),
    ...mapGetters('account', ['address', 'isReadyToRumble']),
    offerNfts () {
      return this.account.nfts
    },
    continueText () {
      return ContinueTexts[this.offerState]
    },
    isWalletConnected () {
      return this.address
    },
    isNetworkSupported () {
      return this.address && this.account.network
    },
    stepInstruction () {
      return Instructions[this.offerState]
    },
    pageTitle () {
      if (!this.isWalletConnected) {
        return 'Connect Your Wallet'
      }
      return PageTitles[this.offerState]
    },
    createOfferFee () {
      return this.$store.state.account.fees.createOfferFee
    },
    deadlineTimestamp () {
      const timestamp = Math.round(new Date().getTime() / 1000)
      return timestamp + this.deadlineUnitsType.value * this.deadlineValue
    },
    deadlineTimestampFormatted () {
      return new Date(this.deadlineTimestamp * 1000).toLocaleString()
    },
  },
  methods: {
    addOfferNFTs () {
      this.offer.items = [...this.offer.items, ...this.offer.dialogSelected]
      this.offer.dialogSelected = []
      this.dialog = false
    },
    async continueBarter () {
      switch (this.offerState) {
        case (OfferState.Initial): {
          this.pendingOffer = getOffer(this)
          this.offerState = OfferState.Preview
          break
        }
        case (OfferState.Approvals):
        case (OfferState.Preview): {
          this.offerState = OfferState.Approvals
          const barterContractAddress = this.$store.getters['account/barterContractAddress']
          let didGetAllApprovals = true
          const usedNftAddresses = {}
          for (const asset of this.pendingOffer.side0Assets) {
            this.isLoading = true
            try {
              switch (asset.assetType) {
                case AssetType.erc721: {
                  if (usedNftAddresses[asset.contractAddress]) {
                    continue
                  }
                  const contract = await contracts.createERC721(asset.contractAddress)
                  const hasApproval = await contract.methods.isApprovedForAll(this.pendingOffer.side0, barterContractAddress).call({ from: this.pendingOffer.side0 })
                  if (!hasApproval) {
                    this.loadingText = 'Waiting for ERC721 approval transaction to complete'
                    await contract.methods.setApprovalForAll(barterContractAddress, true).send({ from: this.pendingOffer.side0 })
                  }
                  usedNftAddresses[asset.contractAddress] = true
                  break
                }
                case AssetType.erc20: {
                  const contract = await contracts.createERC20(asset.contractAddress)
                  const allowance = await contract.methods.allowance(this.pendingOffer.side0, barterContractAddress).call({ from: this.pendingOffer.side0 })
                  if (toBN(allowance).cmp(toBN(asset.amount)) === -1 || confirm('You already have allowance, need more?')) {
                    this.loadingText = 'Waiting for ERC20 approval transaction to complete'
                    await contract.methods.approve(barterContractAddress, toBN(asset.amount)).send({ from: this.pendingOffer.side0 })
                  }
                  break
                }
              }
            } catch (e) {
              console.log('Approval failed', e)
              didGetAllApprovals = false
            }
            this.isLoading = false
          }
          if (didGetAllApprovals) {
            this.offerState = OfferState.Creating
          } else {
            alert('Sorry, there are some issues with your approvals, please try again')
          }
          this.pendingOffer = _.cloneDeep(this.pendingOffer)
          this.isLoading = false
          break
        }
        case (OfferState.Creating): {
          this.isLoading = true
          this.loadingText = 'Waiting for offer creation transaction to complete'
          const barterContract = await contracts.createBarterContract()
          const options = {
            value: await barterContract.methods.createOfferFee().call(),
            from: this.pendingOffer.side0,
          }
          try {
            const deadline = this.hasDeadline ? this.deadlineTimestamp : 0
            const result = await barterContract.methods
              .createOffer(
                this.pendingOffer.side1,
                this.pendingOffer.side0Assets.map(amountToString),
                this.pendingOffer.side1Assets.map(amountToString),
                deadline,
              )
              .send(options)
            function amountToString (a) {
              return {
                ...a,
                amount: '0x' + a.amount.toString(16),
              }
            }
            const offerId = result.events.OfferCreated.returnValues.offerId
            this.isLoading = false
            this.$router.push(`/offers/${offerId}?chain=${this.account.network.chain}`)
            this.$store.dispatch('account/sync')
          } catch (e) {
            console.log('Offer creation error', { offer: this.pendingOffer }, e)
          }
          this.isLoading = false
          break
        }
      }
      function getOffer (that) {
        const side0 = that.address
        const side1 = that.side1.address
        const side0Assets = getAssetsForOffer(that.side0)
        const side1Assets = getAssetsForOffer(that.side1)
        return {
          side0,
          side1,
          side0Assets,
          side1Assets,
        }
      }
      function getAssetsForOffer (sideAssets) {
        const assets = []
        for (const asset of sideAssets.selectedItems) {
          const assetType = getAssetType(asset)
          const amount = getAssetAmount(asset)

          assets.push({
            contractAddress: asset.token_address,
            tokenId: asset.token_id,
            assetType,
            amount,
          })
        }
        for (const erc20Asset of sideAssets.erc20Assets) {
          assets.push({
            contractAddress: erc20Asset.contractAddress,
            tokenId: 0,
            assetType: 1,
            amount: getERC20Amount(erc20Asset),
          })
        }

        return assets
      }
      function getAssetType () {
        return 0
      }
      function getAssetAmount () {
        return 0
      }
      function getERC20Amount (erc20) {
        return Moralis.Units.Token(erc20.amount, erc20.decimals)
      }
    },
    confirmSide0 (side0) {
      this.side0 = side0
    },
    confirmSide1 (side1) {
      this.side1 = side1
    },
    makeSide0Dirty () {
      this.side0 = null
    },
    makeSide1Dirty () {
      this.side1 = null
    },
    connectWallet () {
      this.$store.dispatch('account/login')
    },
    backBarter () {
      switch (this.offerState) {
        case (OfferState.Creating): {
          this.offerState = OfferState.Approvals
          break
        }
        default:
          this.pendingOffer = null
          this.offerState = OfferState.Initial
          break
      }
    },
  },
}
</script>
