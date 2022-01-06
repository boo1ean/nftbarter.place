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
    }
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
      console.log(barterContract)

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

      const side0Assets = getAssetsForOffer(this.side0)
      const side1Assets = getAssetsForOffer(this.side1)

      console.log('side0', side0Assets, '\n\nside1', side1Assets)

      const result = await barterContract.methods
        .createOffer(this.side1.address, side0Assets, side1Assets)
        .send({ from: this.address })

      console.log('Offer created', result.events.OfferCreated)
      // {blockHash: '0xbe56c7494e439326903c61aaaa6a0faa7324f0c48bdd2686eebe9f05b0c544e7', blockNumber: 14096672, contractAddress: null, cumulativeGasUsed: 12260185, from: '0x59fdb74bd93974f8e30007494accd7d227e855c0', …}
      // blockHash: "0xbe56c7494e439326903c61aaaa6a0faa7324f0c48bdd2686eebe9f05b0c544e7"
      // blockNumber: 14096672
      // contractAddress: null
      // cumulativeGasUsed: 12260185
      // events:
      //   OfferCreated:
      //     address: "0xe8A1C00b29a37A1683Ddf7dD38522eEB5df308c3"
      // blockHash: "0xbe56c7494e439326903c61aaaa6a0faa7324f0c48bdd2686eebe9f05b0c544e7"
      // blockNumber: 14096672
      // event: "OfferCreated"
      // id: "log_e9cca7c0"
      // logIndex: 305
      // raw: {data: '0x000000000000000000000000000000000000000000000000…00000000059fdb74bd93974f8e30007494accd7d227e855c0', topics: Array(1)}
      // removed: false
      // returnValues: Result {0: '0', 1: '0x59FdB74bd93974f8e30007494aCCD7d227E855C0', 2: '0x59FdB74bd93974f8e30007494aCCD7d227E855C0', offerId: '0', side0: '0x59FdB74bd93974f8e30007494aCCD7d227E855C0', side1: '0x59FdB74bd93974f8e30007494aCCD7d227E855C0'}
      // signature: "0xc15c04e4d066b073dc7bcc4304c46edcf1d537a17a94a544037da3414bd677ef"
      // transactionHash: "0x1bcfbe85c02427693b9912c21b8df6e5dfe7422f171135bfd471d3e44515950c"
      // transactionIndex: 102
      //   [[Prototype]]: Object
      //   [[Prototype]]: Object
      // from: "0x59fdb74bd93974f8e30007494accd7d227e855c0"
      // gasUsed: 255315
      // logsBloom: "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002008000000000000000000000000000000004000000000000000000000000000000"
      // status: true
      // to: "0xe8a1c00b29a37a1683ddf7dd38522eeb5df308c3"
      // transactionHash: "0x1bcfbe85c02427693b9912c21b8df6e5dfe7422f171135bfd471d3e44515950c"
      // transactionIndex: 102
      // type: "0x0"
      // result
      //   .on('receipt', (receipt) => {
      //     // receipt example
      //     console.log('receipt', receipt)
      // > {
      //     "transactionHash": "0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b",
      //       "transactionIndex": 0,
      //       "blockHash": "0xef95f2f1ed3ca60b048b4bf67cde2195961e0bba6f70bcbea9a2c4e133e34b46",
      //       "blockNumber": 3,
      //       "contractAddress": "0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe",
      //       "cumulativeGasUsed": 314159,
      //       "gasUsed": 30234,
      //       "events": {
      //       "MyEvent": {
      //         returnValues: {
      //           myIndexedParam: 20,
      //             myOtherIndexedParam: '0x123456789...',
      //             myNonIndexParam: 'My String'
      //         },
      //         raw: {
      //           data: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      //             topics: ['0xfd43ade1c09fade1c0d57a7af66ab4ead7c2c2eb7b11a91ffdd57a7af66ab4ead7', '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385']
      //         },
      //         event: 'MyEvent',
      //           signature: '0xfd43ade1c09fade1c0d57a7af66ab4ead7c2c2eb7b11a91ffdd57a7af66ab4ead7',
      //           logIndex: 0,
      //           transactionIndex: 0,
      //           transactionHash: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      //           blockHash: '0xfd43ade1c09fade1c0d57a7af66ab4ead7c2c2eb7b11a91ffdd57a7af66ab4ead7',
      //           blockNumber: 1234,
      //           address: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe'
      //       },
      //       "MyOtherEvent": {
      //       ...
      //       },
      //       "MyMultipleEvent":[{...}, {...}] // If there are multiple of the same event, they will be in an array
      //     }
      //   }
      // })
      // .on('error', (error, receipt) => {
      //   console.log('error', error, receipt)
      // })

      // console.log(barterContract.methods)
      // console.log(result)
      //
      // TODO get approvals

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
        return toBN(erc20.amount).mul(toBN(10).pow(toBN(erc20.decimals))).toString()
      }

      function toBN (val) {
        return web3.utils.toBN(val)
      }
    },
    confirmSide0 (side0) {
      this.side0 = side0
      console.log(side0)
    },
    confirmSide1 (side1) {
      this.side1 = side1
      console.log(side1)
    },
  }
}
</script>
