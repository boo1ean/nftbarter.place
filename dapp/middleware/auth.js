import _ from 'lodash'
export default function ({ store, redirect }) {
  if (!_.get(window, 'web3.currentProvider.selectedAddress', false)) {
    return redirect('/')
  }
}
