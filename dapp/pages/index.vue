<template lang="pug">
v-container(fluid)
  v-sheet(
    v-if="!isWalletConnected"
    elevation=1
    color="blue-grey lighten-2"
    shaped
  ).py-6.mb-4.d-flex.justify-center.align-center.flex-column.hello
    div
      span.hello Welcome to&nbsp;
      b.hello nftbarter.place
    div.hello Please connect your wallet to proceed
    v-btn(
      x-large
      @click.stop="connectWallet"
    ).mt-3 CONNECT WITH METAMASK
  ProgressIndicator(v-if="isApprovalLoading" :big="true").mt-10.pt-10
  OfferDigest(v-else-if="pendingOffer" :offer="pendingOffer")
  v-row(v-else)
    v-col(sm=12 lg=6)
      BarterSide(
        label="Your offer"
        :address="address"
        @confirm="confirmSide0"
        @dirty="makeSide0Dirty"
      )
    v-col(sm=12 lg=6)
      BarterSide(
        label="Your expectations"
        @confirm="confirmSide1"
        @dirty="makeSide1Dirty"
      )
  .actions-container
    v-card
      v-card-title Creating barter offer
      v-card-text
        v-stepper(
          elevation=0
          v-model="offerState"
        )
          v-stepper-header
            v-stepper-step(:complete='offerState > 0' step='0') Select Assets
            v-divider
            v-stepper-step(:complete='offerState > 1' step='1') Preview
            v-divider
            v-stepper-step(:complete='offerState > 2' step='2') Approve permissions
            v-divider
            v-stepper-step(step='3') Create offer
      v-card-actions
        v-btn(
          color="success"
          block
          @click="continueBarter"
          :disabled="!side0 || !side1"
        ) {{ continueText }}
</template>

<style>
.actions-container {
  position: fixed;
  bottom: 30px;
  right: 30px
}
.hello {
  color: white;
  font-size: 2rem;
}
</style>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import Moralis from 'moralis'
import NFTMetadata from '../components/NFTMetadata'
import BarterSide from '../components/BarterSide'
import contracts from '@/utils/contracts'

const OfferState = {
  Initial: 0,
  Preview: 1,
  Approvals: 2,
  Creating: 3,
}

const AssetType = {
  erc721: 0,
  erc20: 1,
}

const ContinueTexts = {
  [OfferState.Initial]: 'Continue',
  [OfferState.Preview]: 'Approve permissions',
  [OfferState.Approvals]: 'Approve permissions',
  [OfferState.Creating]: 'Create offer',
}

export default {
  name: 'PageBarter',
  components: {
    NFTMetadata,
    BarterSide,
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
      isApprovalLoading: false,
    }
  },
  computed: {
    ...mapState(['account']),
    ...mapGetters('account', ['address']),
    offerNfts () {
      return this.account.nfts
    },
    continueText () {
      return ContinueTexts[this.offerState]
    },
    isWalletConnected () {
      return this.address
    },
  },
  methods: {
    ...mapActions('account', ['fetchAccountNFTS']),
    addOfferNFTs () {
      this.offer.items = [...this.offer.items, ...this.offer.dialogSelected]
      this.offer.dialogSelected = []
      this.dialog = false
    },
    async continueBarter () {
      const web3Utils = new Moralis.Web3()
      switch (this.offerState) {
        case (OfferState.Initial): {
          this.pendingOffer = getOffer(this)
          this.offerState = OfferState.Preview
          break
        }
        case (OfferState.Approvals):
        case (OfferState.Preview): {
          this.offerState = OfferState.Approvals
          const barterContractAddress = await contracts.addresses().barter
          let didGetAllApprovals = true
          const usedNftAddresses = {}
          for (const asset of this.pendingOffer.side0Assets) {
            this.isApprovalLoading = true
            try {
              switch (asset.assetType) {
                case AssetType.erc721: {
                  if (usedNftAddresses[asset.contractAddress]) {
                    continue
                  }
                  const contract = await contracts.createERC721(asset.contractAddress)
                  const hasApproval = await contract.methods.isApprovedForAll(this.pendingOffer.side0, barterContractAddress).call({ from: this.pendingOffer.side0 })
                  if (!hasApproval) {
                    await contract.methods.setApprovalForAll(barterContractAddress, true).send({ from: this.pendingOffer.side0 })
                  }
                  usedNftAddresses[asset.contractAddress] = true
                  break
                }
                case AssetType.erc20: {
                  const contract = await contracts.createERC20(asset.contractAddress)
                  const allowance = await contract.methods.allowance(this.pendingOffer.side0, barterContractAddress).call({ from: this.pendingOffer.side0 })
                  if (toBN(allowance).cmp(toBN(asset.amount)) === -1 || confirm('You already have allowance, need more?')) {
                    await contract.methods.approve(barterContractAddress, asset.amount).send({ from: this.pendingOffer.side0 })
                  }
                  break
                }
              }
            } catch (e) {
              console.log('Approval failed', e)
              didGetAllApprovals = false
            }
            this.isApprovalLoading = false
          }
          if (didGetAllApprovals) {
            this.offerState = OfferState.Creating
          } else {
            alert('Sorry, there are some issues with your approvals, please try again')
          }
          this.isApprovalLoading = false
          break
        }
        case (OfferState.Creating): {
          this.isApprovalLoading = true
          const barterContract = await contracts.createBarterContract()
          try {
            const result = await barterContract.methods
              .createOffer(
                this.pendingOffer.side1,
                this.pendingOffer.side0Assets,
                this.pendingOffer.side1Assets,
              )
              .send({ from: this.pendingOffer.side0 })
            const offerId = result.events.OfferCreated.returnValues.offerId
            this.isApprovalLoading = false
            this.$router.push(`/offers/${offerId}?chain=${this.account.network.chain}`)
            this.$store.dispatch('account/sync')
          } catch (e) {
            console.log('Offer creation error', { offer: this.pendingOffer }, e)
          }
          this.isApprovalLoading = false
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
        return Moralis.Units.Token(erc20.amount, erc20.decimals).toString()
      }
      function toBN (val) {
        return web3Utils.utils.toBN(val)
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
  },
}
</script>
