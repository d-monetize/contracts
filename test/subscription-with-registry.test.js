const chai = require("chai")
chai.use(require("chai-as-promised"))
chai.use(require("chai-bignumber")())

const expect = chai.expect

const { ZERO_ADDRESS, web3 } = require("./util")

const SubscriptionRegistry = artifacts.require("SubscriptionRegistry")
const TestToken = artifacts.require("TestToken")
const SubscriptionWithRegistry = artifacts.require("SubscriptionWithRegistry")

contract("SubscriptionWithRegistry", accounts => {
  let subscriptionRegistry
  let token
  let subscription

  beforeEach(async () => {
    subscriptionRegistry = await SubscriptionRegistry.new()
    token = await TestToken.new()

    const amount = 10
    const interval = 3600
    const bounty = 1

    subscription = await SubscriptionWithRegistry.new(
      token.address,
      amount,
      interval,
      bounty,
      subscriptionRegistry.address,
      {
        from: accounts[1],
      }
    )

    await subscriptionRegistry.addSubscription(
      subscription.address,
      accounts[1]
    )
  })

  describe("constructor", () => {
    it("should set subscription registry", async () => {
      const subscription = await SubscriptionWithRegistry.new(
        token.address,
        10,
        100,
        1,
        subscriptionRegistry.address,
        {
          from: accounts[1],
        }
      )

      assert.equal(
        await subscription.subscriptionRegistry(),
        subscriptionRegistry.address
      )
    })

    it("should reject if subscription address is zero", async () => {
      await expect(
        SubscriptionWithRegistry.new(token.address, 10, 100, 1, ZERO_ADDRESS, {
          from: accounts[1],
        })
      ).to.be.rejected
    })
  })

  describe("subscribe", async () => {
    it("should subscribe", async () => {
      await subscription.subscribe({ from: accounts[2] })

      assert.equal(
        await subscriptionRegistry.getSubscribedByCount(accounts[2]),
        1
      )
      assert.equal(
        await subscriptionRegistry.getSubscribedBy(accounts[2], 0),
        subscription.address
      )
    })
  })

  describe("unsubscribe", async () => {
    it("should unsubscribe", async () => {
      await subscription.subscribe({ from: accounts[2] })
      await subscription.unsubscribe({ from: accounts[2] })

      assert.equal(
        await subscriptionRegistry.getSubscribedByCount(accounts[2]),
        0
      )
    })
  })

  describe("kill", () => {
    it("should kill", async () => {
      await subscription.kill({ from: accounts[1] })
      // check if contract is deleted
      await expect(subscription.owner()).to.be.rejected
    })

    it("should reject if not owner", async () => {
      await expect(subscription.kill({ from: accounts[2] })).to.be.rejected
    })
  })
})
