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

env (cat .env.mythx)  truffle run verify
```

### Migration (Ropsten)

```shell
# copy .env and edit
cp .env.sample .env

npm run migrate:ropsten
```

### Deployed Contract

##### Ropsten

- SubscriptionRegistry `0x7251f82DDc54E367691E716b75a36d32bff95496`
- TestToken `0x8AA545658a69195c5799eBEe6f54f5C758C91aeB`

### Misc

Concat contracts

```
npx truffle-flattener contracts/Contract.sol
```
