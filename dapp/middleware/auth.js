export default function ({ store, redirect }) {
    if (!store.getters['account/address']) {
        return redirect('/')
    }
}