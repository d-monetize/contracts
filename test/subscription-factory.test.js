const chai = require("chai")
chai.use(require("chai-as-promised"))
chai.use(require("chai-bignumber")())

const expect = chai.expect

const { ZERO_ADDRESS, web3 } = require("./util")

const TestToken = artifacts.require("TestToken")
const SubscriptionFactory = artifacts.require("SubscriptionFactory")
const SubscriptionRegistry = artifacts.require("SubscriptionRegistry")
const Subscription = artifacts.require("Subscription")

contract("SubscriptionFactory", accounts => {
  const SUBSCRIPTION_OWNER = accounts[1]
  const SUBSCRIBER = accounts[2]

  let subscriptionFactory
  let subscriptionRegistry

  beforeEach(async () => {
    subscriptionFactory = await SubscriptionFactory.new()
    subscriptionRegistry = await SubscriptionRegistry.at(
      await subscriptionFactory.subscriptionRegistry()
    )
  })

  describe("constructor", () => {
    it("should initialize SubscriptionRegistry", async () => {
      assert.notEqual(
        await subscriptionFactory.subscriptionRegistry(),
        ZERO_ADDRESS
      )
    })
  })

  it("should create", async () => {
    const testToken = await TestToken.new()
    const amount = 100
    const interval = 3600
    const bounty = 1

    const tx = await subscriptionFactory.create(
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

    const subscription = await Subscription.at(logs[0].args.subscription)

    assert.equal(await subscription.owner(), SUBSCRIPTION_OWNER)

    assert.equal(
      await subscriptionRegistry.getCreatedByCount(SUBSCRIPTION_OWNER),
      1
    )
    assert.equal(
      await subscriptionRegistry.getCreatedBy(SUBSCRIPTION_OWNER, 0),
      subscription.address
    )
  })
})
