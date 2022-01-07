<template lang="pug">
v-container(fluid)
  .loader(v-if="isLoading")
    h4 Loading...
  v-row(v-if="nftAssets.length")
    v-col
      h4 NFTS
      v-simple-table(dense)
        template(v-slot:default)
          thead
            tr
              th Token
              th Metadata
              th Ownership
              th Approval
          tbody
            tr(v-for="item in nftAssets")
              td
                NFTLink(:contract="item.token_address", :token-id="item.token_id")
              td
                NFTMetadata(:data="item.metadata")
              td
                v-alert(v-if="!item.ownershipIssue" dense text type="success").my-1 Valid
                v-alert(v-else dense text type="error").my-1
                  span Invalid
              td
                v-alert(v-if="!item.approvalIssue" dense text type="success").my-1 Valid
                v-alert(v-else dense text type="error").my-1
                  span Missing
  v-row(v-if="erc20Assets.length")
    v-col
      h4 ERC20 Tokens
      v-simple-table(dense)
        template(v-slot:default)
          thead
            tr
              th Symbol
              th Contract
              th Amount
              th Balance
              th Allowance
          tbody
            tr(v-for="item in erc20Assets")
              td
                ContractLink(:address="item.symbol")
              td
                ContractLink(:address="item.address")
              td
                TokenBalance(:balance="item.amount" :decimals="item.decimals")
              td
                v-alert(v-if="!item.balanceIssue" dense text type="success" ).my-1 Valid
                v-alert(v-else dense text type="error" ).my-1
                  span Insufficient:&nbsp;
                  TokenBalance(:balance="item.balanceIssue" :decimals="item.decimals")
              td
                v-alert(v-if="!item.allowanceIssue" dense text type="success" ).my-1 Valid
                v-alert(v-else dense text type="error" ).my-1
                  span Insufficient

</template>
<script>
import _ from 'lodash'
import NFTLink from '@/components/NFTLink'
import Moralis from '@/utils/moralis'
import NFTMetadata from '@/components/NFTMetadata'
import contracts from '@/utils/contracts'

export default {
  name: 'OfferSideDigest',
  props: ['address', 'assets'],
  components: {
    NFTLink,
    NFTMetadata,
  },
  data () {
    return {
      isLoading: true,
      nftAssets: [],
      erc20Assets: [],
    }
  },
  async mounted () {
    this.isLoading = true
    const nfts = this.assets.filter(x => +x.assetType !== 1)
    const erc20s = this.assets.filter(x => +x.assetType === 1)
    const web3 = new Moralis.Web3()
    const network = this.$store.state.account.network

    const nftsPromises = []
    const nftsIssuesPromises = []
    const nftsApprovalsPromises = []
    for (const nft of nfts) {
      const options = {
        address: nft.contractAddress,
        token_id: nft.tokenId,
        chain: this.$store.state.account.network.chain,
      }
      nftsPromises.push(Moralis.Web3API.token.getTokenIdMetadata(options))
      // TODO add erc1155 support
      // check NFTs ownership
      const contract = await contracts.createERC721(nft.contractAddress)
      nftsIssuesPromises.push(
        contract.methods.ownerOf(nft.tokenId)
          .call()
          .then((ownerAddress) => {
            if (ownerAddress.toLowerCase() !== this.address.toLowerCase()) {
              return {
                asset: nft,
                currentOwner: ownerAddress,
              }
            }
            return false
          }),
      )
      // check NFTs approvals
      nftsApprovalsPromises.push(
        contract.methods.isApprovedForAll(this.address, contracts.addresses(network).barter).call()
          .then((approval) => {
            if (!approval) {
              return {
                asset: nft,
              }
            }
            return false
          }),
      )
    }
    // Get erc20s metadata
    const erc20Promises = []
    const erc20AmountsPromises = []
    const erc20AllowancePromises = []
    for (const erc20 of erc20s) {
      const options = {
        addresses: erc20.contractAddress,
        chain: this.$store.state.account.network.chain,
      }
      erc20Promises.push(Moralis.Web3API.token.getTokenMetadata(options).then(([token]) => {
        return {
          ...token,
          amount: erc20.amount,
        }
      }))
      const contract = await contracts.createERC20(erc20.contractAddress)
      erc20AmountsPromises.push(
        contract.methods.balanceOf(this.address).call()
          .then((balance) => {
            if (web3.utils.toBN(balance).cmp(web3.utils.toBN(erc20.amount)) === -1) {
              return {
                asset: erc20,
                balance,
              }
            }
            return false
          }),
      )
      erc20AllowancePromises.push(
        contract.methods.allowance(this.address, contracts.addresses(network).barter).call()
          .then((allowance) => {
            if (web3.utils.toBN(allowance).cmp(web3.utils.toBN(erc20.amount)) === -1) {
              return {
                asset: erc20,
                allowance,
              }
            }
            return false
          }),
      )
    }
    const [nftsApprovals, erc20Allowances] = await Promise.all([Promise.all(nftsApprovalsPromises), Promise.all(erc20AllowancePromises)])
    const [nftsIssues, erc20balanceIssues] = await Promise.all([Promise.all(nftsIssuesPromises), Promise.all(erc20AmountsPromises)])
    const [nftsAssets, erc20Assets] = await Promise.all([Promise.all(nftsPromises), Promise.all(erc20Promises)])
    for (const issue of nftsIssues) {
      if (!issue) {
        continue
      }
      const asset = _.find(nftsAssets, asset => asset.token_address.toLowerCase() === issue.asset.contractAddress.toLowerCase() && asset.token_id === issue.asset.tokenId)
      asset.ownershipIssue = 'Missing ownership'
    }
    for (const issue of nftsApprovals) {
      if (!issue) {
        continue
      }
      const asset = _.find(nftsAssets, asset => asset.token_address.toLowerCase() === issue.asset.contractAddress.toLowerCase() && asset.token_id === issue.asset.tokenId)
      asset.approvalIssue = 'Missing approval'
    }
    for (const issue of erc20balanceIssues) {
      if (!issue) {
        continue
      }
      const asset = _.find(erc20Assets, asset => asset.address.toLowerCase() === issue.asset.contractAddress.toLowerCase())
      asset.balanceIssue = issue.balance
    }
    for (const issue of erc20Allowances) {
      if (!issue) {
        continue
      }
      const asset = _.find(erc20Assets, asset => asset.address.toLowerCase() === issue.asset.contractAddress.toLowerCase())
      asset.allowanceIssue = issue.allowance
    }
    this.nftAssets = nftsAssets
    this.erc20Assets = erc20Assets
    this.isLoading = false
  },
}
</script>
