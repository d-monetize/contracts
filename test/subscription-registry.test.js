const chai = require("chai")
chai.use(require("chai-as-promised"))
chai.use(require("chai-bignumber")())

const expect = chai.expect

const { ZERO_ADDRESS, web3 } = require("./util")

const TestToken = artifacts.require("TestToken")
const SubscriptionRegistry = artifacts.require("SubscriptionRegistry")

contract("SubscriptionRegistry", accounts => {
  const SUBSCRIPTION_OWNER = accounts[1]
  const SUBSCRIBER = accounts[2]

  let subscriptionRegistry

  beforeEach(async () => {
    subscriptionRegistry = await SubscriptionRegistry.new()
  })

  it("should create", async () => {
    const testToken = await TestToken.new()
    const amount = 100
    const interval = 3600
    const bounty = 1

    const tx = await subscriptionRegistry.create(
      testToken.address,
      amount,
      interval,
      bounty,
      {
        from: SUBSCRIPTION_OWNER,
      }
    )

    const { logs } = tx

    assert.equal(logs[0].event, "SubscriptionCreated")
    assert.equal(logs[0].args.owner, SUBSCRIPTION_OWNER)
    assert.equal(logs[0].args.token, testToken.address)
    assert.equal(logs[0].args.amount, amount)
    assert.equal(logs[0].args.interval, interval)
    assert.equal(logs[0].args.bounty, bounty)
  })
})
