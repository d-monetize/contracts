# contracts

[![CircleCI](https://circleci.com/gh/d-monetize/contracts.svg?style=svg)](https://circleci.com/gh/d-monetize/contracts)

# Development

```shell
npm run chain

# compile
npx truffle compile

# From another terminal
npm run migrate:dev
```

# Test

```shell
npm run chain
# From another terminal
npm test
```

# Migration (Ropsten)

```shell
# copy .env and edit
cp .env.sample .env

npm run migrate:ropsten
```

# Deployed Contract
