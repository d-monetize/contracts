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

- SubscriptionFactory `0xFAb207d5E488C7BCD10442Fe83fFc2775F0617Bb`
- TestToken `0xf7e6C56A1D35d56cAb563AEC50B2efd1b76e0882`

### Misc

Concat contracts

```
npx truffle-flattener contracts/Contract.sol
```
