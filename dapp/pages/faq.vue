<template lang="pug">
v-container
  h1 FAQ
  v-expansion-panels.mt-4(multiple)
    v-expansion-panel(v-for='(item, i) in items' :key='i')
      v-expansion-panel-header
        h3 {{ item.q }}
      v-expansion-panel-content(v-html="item.a").px-6.pb-6
</template>
<script>
import contractsConfig from '../contracts-config.json'
import { networks } from '@/utils/networks'
export default {
  name: 'FAQPage',
  head () {
    return {
      title: 'FAQ',
    }
  },
  data () {
    return {
      items: [
        {
          q: 'How does it work?',
          a: `
          <div>
            <a href="https://www.youtube.com/watch?v=SzqaSZR6oyQ&ab_channel=nftbarterplace" target="_blank">Youtube video demonstrating Create & Accept offer flow</a>
            <ol class="mt-2">
              <li> Connect wallet</li>
              <li> Select assets you want to exchange (erc721 or erc20 tokens)</li>
              <li> Specify counterparty address</li>
              <li> Select counterparty assets you want to get</li>
              <li> Press continue and review your offer (check contract addresses carefully and token ids closely).</li>
              <li> Allow barter contract to manage your selected assets (assets won't be moved until the counter-side accepts the offer).</li>
              <li> Press create offer button (creates an offer using barter contract).</li>
              <li> Wait for the offer creation transaction to complete and get the offer link.</li>
              <li> Send an offer link to your counterparty.</li>
              <li> Counterparty opens the link connects wallet and accepts the offer.</li>
              <li> Exchange is completed!</li>
            </ol>
          </div>
    `,
        },
        {
          q: 'Is it safe?',
          a: `
          You interact solely with the barter smart contract.<br />
          No intermediates are involved.<br />
          Read contract source code to make sure everything makes sense for you.<br/>
          Everything in crypto involves some risks.<br/>
          Always DYOR to make sure it is safe for you.
        `,
        },
        {
          q: 'Is XXX blockchain supported?',
          a: `
          <div>
            Currently supported chains:<br />
            <ul>
              ${networks.map(n => `<li>${n.name}</li>`).join('')}
            </ul>
          </div>
        `,
        },
        {
          q: 'Contracts addresses',
          a: `
          <table>
            ${networks.map(n => `
            <tr>
                <td><b>${n.name}</b></td>
                <td class="pl-4">
                    <a href="${n.explorerURL}/address/${contractsConfig.BarterPlace[n.chain]}" target="_blank">
                      ${contractsConfig.BarterPlace[n.chain]}
                    </a>
                </td>
            </tr>
            `).join('')}
          </table>
          `,
        },
      ],
    }
  },
}
</script>
