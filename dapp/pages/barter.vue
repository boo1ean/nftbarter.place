<template lang="pug">
v-container(fluid)
  v-row
    v-col(sm=12 lg=6)
      BarterSide(
        label="Your offer"
        :address="address"
        @confirm="confirmSide0"
      )
    v-col(sm=12 lg=6)
      BarterSide(
        label="Your expectations"
        @confirm="confirmSide1"
      )
    .actions-container
      v-card
        v-card-title Creating barter offer
        v-card-text
          v-stepper(
            elevation=0
          )
            v-stepper-header
              v-stepper-step(:complete='offerState > 0' step='1') Select tokens
              v-divider
              v-stepper-step(:complete='offerState > 1' step='2') Approve contracts
              v-divider
              v-stepper-step(step='3') Create offer
        v-card-actions
          v-btn(
            color="success"
            block
            @click="continueBarter"
            :disabled="!side0 || !side1"
          ) Create offer
</template>

<style>
.actions-container {
  position: fixed;
  bottom: 30px;
  right: 30px
}
</style>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
import NFTMetadata from '../components/NFTMetadata'
import BarterSide from '../components/BarterSide'
import Moralis from '../utils/moralis'
import contractsConfig from '../contracts-config.json'
import contracts from '@/utils/contracts'

const OfferState = {
  Initial: 0,
  Approvals: 1,
  Creating: 2,
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
    }
  },
  computed: {
    ...mapState(['account']),
    ...mapGetters('account', ['address']),
    offerNfts () {
      return this.account.nfts
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
      const web3 = await Moralis.enableWeb3()
      const barterContract = new web3.eth.Contract(contractsConfig.BarterPlace.abi, contractsConfig.BarterPlace.address)

      // amount: "1"
      // block_number: "13679394"
      // block_number_minted: "13679394"
      // contract_type: "ERC721"
      // frozen: 0
      // is_valid: 1
      // metadata: "{\"name\": \"Bella Potion\", \"image\": \"https://beasties.online/public_assets/potions/bella_babe_potion.png\", \"animation_url\": \"https://beasties.online/public_assets/potions/bella_babe_potion_min.mp4\", \"attributes\": [{\"trait_type\": \"Rarity\", \"value\": \"common\"}, {\"trait_type\": \"MA\", \"value\": 1}, {\"trait_type\": \"MD\", \"value\": 1}, {\"trait_type\": \"PA\", \"value\": 1}, {\"trait_type\": \"PD\", \"value\": 1}]}\n"
      // name: "Magic Potions"
      // owner_of: "0x59fdb74bd93974f8e30007494accd7d227e855c0"
      // symbol: "MGPTNS"
      // synced_at: "2021-12-21T21:48:33.357Z"
      // syncing: 2
      // token_address: "0xb57644942016068738f4af4801fc4a7e2df9a7eb"
      // token_id: "14510"
      // token_uri: "https://api.beasties.online/potions/14510"
      // uniqueId: "0xb57644942016068738f4af4801fc4a7e2df9a7eb

      const [side0Issues, side1Issues] = await Promise.all([
        await validateAssets(this.side0),
        await validateAssets(this.side1),
      ])

      console.log('side0 issues', side0Issues)
      console.log('side1 issues', side1Issues)

      const side0Assets = getAssetsForOffer(this.side0)
      const side1Assets = getAssetsForOffer(this.side1)

      console.log('side0', side0Assets, '\n\nside1', side1Assets)

      try {
        const result = await barterContract.methods
          .createOffer(this.side1.address, side0Assets, side1Assets)
          .send({ from: this.address })
        console.log('Offer created', result.events.OfferCreated)
      } catch (e) {
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

      async function validateAssets (side) {
        const nftIssuesPromises = []
        for (const asset of side.selectedItems) {
          const contract = await contracts.createERC721(asset.token_address)
          nftIssuesPromises.push(
            contract.methods.ownerOf(asset.token_id)
              .call()
              .then((ownerAddress) => {
                if (ownerAddress.toLowerCase() !== side.address.toLowerCase()) {
                  return {
                    asset,
                    currentOwner: ownerAddress,
                  }
                }
                return false
              }),
          )
        }

        const nftIssues = (await Promise.all(nftIssuesPromises)).filter(Boolean)

        const balanceIssuesPromises = []
        for (const erc20Asset of side.erc20Assets) {
          const contract = await contracts.createERC20(erc20Asset.contractAddress)
          balanceIssuesPromises.push(
            contract.methods.balanceOf(side.address)
              .call()
              .then((balance) => {
                const requiredAmount = getERC20Amount(erc20Asset)
                if (toBN(balance).cmp(toBN(requiredAmount)) === -1) {
                  return {
                    symbol: erc20Asset.symbol,
                    address: erc20Asset.contractAddress,
                    balance,
                    requiredAmount,
                  }
                }
                return false
              }),
          )
        }
        const balanceIssues = (await Promise.all(balanceIssuesPromises)).filter(Boolean)

        return nftIssues.concat(balanceIssues)
      }

      function getAssetType () {
        return 0
      }

      function getAssetAmount () {
        return 0
      }

      function getERC20Amount (erc20) {
        return toBN(erc20.amount).mul(toBN(10).pow(toBN(erc20.decimals))).toString()
      }

      function toBN (val) {
        return web3.utils.toBN(val)
      }
    },
    confirmSide0 (side0) {
      this.side0 = side0
    },
    confirmSide1 (side1) {
      this.side1 = side1
    },
  },
}
</script>
