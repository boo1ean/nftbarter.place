export default function ({ store, redirect }) {
  if (!store.state.account.isOwner) {
    return redirect('/')
  }
}
