# contracts

[![CircleCI](https://circleci.com/gh/d-monetize/contracts.svg?style=svg)](https://circleci.com/gh/d-monetize/contracts)

### Development

```shell
npm run chain

# compile
npx truffle compile

# From another terminal
npm run migrate:dev
```

### Test

```shell
npm run chain
# From another terminal
npm test

env $(cat .env.mythx) truffle run verify
```

### Migration (Ropsten)

```shell
# copy .env and edit
cp .env.sample .env

npm run migrate:ropsten
```

### Deployed Contract

##### Ropsten

- SubscriptionFactory `0x7a00Ecd9a4284a3DA7aCC69c656BAE7AC959e935`
- TestToken `0xaB01CeaFb134905Fc301165cbc7dB2409eCE0739`

### Misc

Concat contracts

```
npx truffle-flattener contracts/Contract.sol
```
