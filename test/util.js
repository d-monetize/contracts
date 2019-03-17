const Web3 = require("web3")
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"))

const TestToken = artifacts.require("TestToken")
const Subscription = artifacts.require("Subscription")

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

async function newSubscription(accounts, params = {}) {
  const testToken = await TestToken.new()

  const {
    payee = accounts[1],
    amount = 10,
    interval = 100,
    token = testToken,
    owner = accounts[0],
  } = params

  return Subscription.new(payee, token.address, amount, interval, {
    from: owner,
  })
}

module.exports = {
  web3,
  ZERO_ADDRESS,
  newSubscription,
}
