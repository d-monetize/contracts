const chai = require("chai")
chai.use(require("chai-as-promised"))
chai.use(require("chai-bignumber")())

const expect = chai.expect

const { ZERO_ADDRESS, web3 } = require("./util")

const SubscriptionRegistry = artifacts.require("SubscriptionRegistry")

contract("SubscriptionRegistry", accounts => {
  // addresses to simulate subscription contract
  const SUBSCRIPTION_CONTRACT_1 = accounts[1]
  const SUBSCRIPTION_CONTRACT_2 = accounts[2]
  // owner of subscription contracts
  const SUBSCRIPTION_OWNER = accounts[3]
  const SUBSCRIBER = accounts[4]

  let subscriptionRegistry

  beforeEach(async () => {
    subscriptionRegistry = await SubscriptionRegistry.new()

    await subscriptionRegistry.addSubscription(
      SUBSCRIPTION_CONTRACT_1,
      SUBSCRIPTION_OWNER
    )
  })

  describe("constructor", () => {
    it("should set owner", async () => {
      assert.equal(await subscriptionRegistry.owner(), accounts[0])
    })
  })

  describe("addSubscription", () => {
    it("should add subscription", async () => {
      const tx = await subscriptionRegistry.addSubscription(
        SUBSCRIPTION_CONTRACT_2,
        SUBSCRIPTION_OWNER
      )

      const { logs } = tx

      assert.equal(logs[0].event, "SubscriptionCreated")
      assert.equal(logs[0].args.subscription, SUBSCRIPTION_CONTRACT_2)
      assert.equal(logs[0].args.owner, SUBSCRIPTION_OWNER)

      assert.equal(
        await subscriptionRegistry.getCreatedByCount(SUBSCRIPTION_OWNER),
        2
      )
      assert.equal(
        await subscriptionRegistry.getCreatedBy(SUBSCRIPTION_OWNER, 1),
        SUBSCRIPTION_CONTRACT_2
      )
      assert.equal(
        await subscriptionRegistry.isRegistered(SUBSCRIPTION_CONTRACT_2),
        true
      )
      assert.equal(
        await subscriptionRegistry.ownerOf(SUBSCRIPTION_CONTRACT_2),
        SUBSCRIPTION_OWNER
      )
    })

    it("should reject if not owner", async () => {
      await expect(
        subscriptionRegistry.addSubscription(
          SUBSCRIPTION_CONTRACT_2,
          SUBSCRIPTION_OWNER,
          {
            from: accounts[4],
          }
        )
      ).to.be.rejected
    })

    it("should reject if already added", async () => {
      await subscriptionRegistry.addSubscription(
        SUBSCRIPTION_CONTRACT_2,
        SUBSCRIPTION_OWNER
      )

      await expect(
        subscriptionRegistry.addSubscription(
          SUBSCRIPTION_CONTRACT_2,
          SUBSCRIPTION_OWNER
        )
      ).to.be.rejected
    })
  })

  describe("removeSubscription", () => {
    it("should remove subscription", async () => {
      const tx = await subscriptionRegistry.removeSubscription({
        from: SUBSCRIPTION_CONTRACT_1,
      })

      const { logs } = tx

      assert.equal(logs[0].event, "SubscriptionDeleted")
      assert.equal(logs[0].args.subscription, SUBSCRIPTION_CONTRACT_1)
      assert.equal(logs[0].args.owner, SUBSCRIPTION_OWNER)

      assert.equal(
        await subscriptionRegistry.getCreatedByCount(SUBSCRIPTION_OWNER),
        0
      )
      assert.equal(
        await subscriptionRegistry.isRegistered(SUBSCRIPTION_CONTRACT_2),
        false
      )
      assert.equal(
        await subscriptionRegistry.ownerOf(SUBSCRIPTION_CONTRACT_2),
        ZERO_ADDRESS
      )
    })

    it("should reject if msg.sender is not registered contract", async () => {
      await expect(
        subscriptionRegistry.removeSubscription({
          from: accounts[4],
        })
      ).to.be.rejected
    })
  })

  describe("addSubscriber", () => {
    it("should add subscriber", async () => {
      const tx = await subscriptionRegistry.addSubscriber(SUBSCRIBER, {
        from: SUBSCRIPTION_CONTRACT_1,
      })

      const { logs } = tx

      assert.equal(logs[0].event, "SubscriberAdded")
      assert.equal(logs[0].args.subscription, SUBSCRIPTION_CONTRACT_1)
      assert.equal(logs[0].args.subscriber, SUBSCRIBER)

      assert.equal(
        await subscriptionRegistry.getSubscribedByCount(SUBSCRIBER),
        1
      )

      assert.equal(
        await subscriptionRegistry.getSubscribedBy(SUBSCRIBER, 0),
        SUBSCRIPTION_CONTRACT_1
      )
    })

    it("should reject if subscription not registered", async () => {
      await expect(
        subscriptionRegistry.addSubscriber(SUBSCRIBER, {
          from: SUBSCRIPTION_CONTRACT_2,
        })
      ).to.be.rejected
    })

    it("should reject if subscriber already added", async () => {
      await subscriptionRegistry.addSubscriber(SUBSCRIBER, {
        from: SUBSCRIPTION_CONTRACT_1,
      })

      await expect(
        subscriptionRegistry.addSubscriber(SUBSCRIBER, {
          from: SUBSCRIPTION_CONTRACT_1,
        })
      ).to.be.rejected
    })
  })

  describe("removeSubscriber", () => {
    beforeEach(async () => {
      await subscriptionRegistry.addSubscriber(SUBSCRIBER, {
        from: SUBSCRIPTION_CONTRACT_1,
      })
    })

    it("should remove subscriber", async () => {
      const tx = await subscriptionRegistry.removeSubscriber(SUBSCRIBER, {
        from: SUBSCRIPTION_CONTRACT_1,
      })

      const { logs } = tx

      assert.equal(logs[0].event, "SubscriberRemoved")
      assert.equal(logs[0].args.subscription, SUBSCRIPTION_CONTRACT_1)
      assert.equal(logs[0].args.subscriber, SUBSCRIBER)

      assert.equal(
        await subscriptionRegistry.getSubscribedByCount(SUBSCRIBER),
        0
      )
    })

    it("should reject if subscription not registered", async () => {
      await expect(
        subscriptionRegistry.removeSubscriber(SUBSCRIBER, {
          from: SUBSCRIPTION_CONTRACT_2,
        })
      ).to.be.rejected
    })

    it("should reject if subscriber already removed", async () => {
      await subscriptionRegistry.removeSubscriber(SUBSCRIBER, {
        from: SUBSCRIPTION_CONTRACT_1,
      })

      await expect(
        subscriptionRegistry.removeSubscriber(SUBSCRIBER, {
          from: SUBSCRIPTION_CONTRACT_1,
        })
      ).to.be.rejected
    })
  })
})
