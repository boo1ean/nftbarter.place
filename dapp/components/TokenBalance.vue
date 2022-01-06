<template lang="pug">
span {{ formattedBalance }}
</template>
<script>
import Moralis from '@/utils/moralis'
const web3 = new Moralis.Web3()

export default {
  name: 'TokenBalance',
  props: ['balance', 'decimals'],
  computed: {
    formattedBalance () {
      return format(this.balance, this.decimals)
    }
  }
}

const precision = 5
function format (x, n) {
  const base = web3.utils.toBN(10).pow(web3.utils.toBN(n))
  const dm = web3.utils.toBN(x).divmod(base)
  return dm.div + '.' + dm.mod.toString(10, n).slice(0, precision)
}
</script>
