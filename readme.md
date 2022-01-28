### Develop frontend

```
cd dapp
yarn dev
```

### Develop contracts

```
cd onchain
yarn test-watch
```

### Deploy frontend

```
cd dapp
yarn build
yarn generate
firebase deploy
```

### Deploy & Verify contracts

Put private key to `onchain/.secret.json`

```
cd onchain
yarn deploy-{chain-alias}
yarn verify-{chain-alias}
```
