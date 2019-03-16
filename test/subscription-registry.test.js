const chai = require("chai")
chai.use(require("chai-as-promised"))
chai.use(require("chai-bignumber")())

const expect = chai.expect

const { ZERO_ADDRESS, web3, newSubscription } = require("./util")

const TestToken = artifacts.require("TestToken")
const Subscription = artifacts.require("Subscription")
const PaymentBounty = artifacts.require("PaymentBounty")
const SubscriptionRegistry = artifacts.require("SubscriptionRegistry")

contract("SubscriptionRegistry", accounts => {
  const SUBSCRIPTION_PAYEE = accounts[1]
  const SUBSCRIBER = accounts[2]

  let paymentBounty
  let subscriptionRegistry
  let testToken

  beforeEach(async () => {
    testToken = await TestToken.new()

    paymentBounty = await PaymentBounty.new()
    subscriptionRegistry = await SubscriptionRegistry.new(paymentBounty.address)

    await paymentBounty.transferOwnership(subscriptionRegistry.address)
  })

  describe("constructor", () => {
    it("should initialize", async () => {
      const subscriptionRegistry = await SubscriptionRegistry.new(
        paymentBounty.address
      )

      assert.equal(
        await subscriptionRegistry.paymentBounty(),
        paymentBounty.address
      )
    })
  })

  describe("createSubscription", () => {
    it("should create", async () => {
      const tx = await subscriptionRegistry.createSubscription(
        testToken.address,
        100,
        1000,
        {
          from: SUBSCRIPTION_PAYEE,
        }
      )

      const { logs } = tx

      assert.equal(logs[0].event, "SubscriptionCreated")
      assert.equal(logs[0].args.payee, SUBSCRIPTION_PAYEE)
      assert.equal(logs[0].args.token, testToken.address)
      assert.equal(logs[0].args.amount, 100)
      assert.equal(logs[0].args.interval, 1000)

      assert.equal(
        await subscriptionRegistry.isRegistered(logs[0].args.subscription),
        true
      )
    })
  })

  describe("deleteSubscription", () => {
    let subscription

    beforeEach(async () => {
      const tx = await subscriptionRegistry.createSubscription(
        testToken.address,
        100,
        1000,
        {
          from: SUBSCRIPTION_PAYEE,
        }
      )

      const { logs } = tx
      subscription = logs[0].args.subscription
    })

    it("should delete", async () => {
      const tx = await subscriptionRegistry.deleteSubscription(subscription, {
        from: SUBSCRIPTION_PAYEE,
      })

      const { logs } = tx

      assert.equal(logs[0].event, "SubscriptionDeleted")
      assert.equal(logs[0].args.payee, SUBSCRIPTION_PAYEE)
      assert.equal(logs[0].args.subscription, subscription)

      assert.equal(await subscriptionRegistry.isRegistered(subscription), false)
    })

    it("should delete payment bounty", async () => {
      await subscriptionRegistry.registerBounty(subscription, 1, {
        from: SUBSCRIPTION_PAYEE,
      })

      await subscriptionRegistry.deleteSubscription(subscription, {
        from: SUBSCRIPTION_PAYEE,
      })

      assert.equal(await paymentBounty.isRegistered(subscription), false)
    })

    it("should reject if not subscription payee", async () => {
      await expect(subscriptionRegistry.deleteSubscription(subscription)).to.be
        .rejected
    })

    it("should reject if subscription not registered", async () => {
      await expect(
        subscriptionRegistry.deleteSubscription(ZERO_ADDRESS, {
          from: SUBSCRIPTION_PAYEE,
        })
      ).to.be.rejected
    })
  })

  describe("pauseSubscription", () => {
    let subscription

    beforeEach(async () => {
      const tx = await subscriptionRegistry.createSubscription(
        testToken.address,
        100,
        1000,
        {
          from: SUBSCRIPTION_PAYEE,
        }
      )

      const { logs } = tx
      subscription = logs[0].args.subscription
    })

    it("should pause", async () => {
      const tx = await subscriptionRegistry.pauseSubscription(subscription, {
        from: SUBSCRIPTION_PAYEE,
      })

      const { logs } = tx

      assert.equal(logs[0].event, "SubscriptionPaused")
      assert.equal(logs[0].args.subscription, subscription)
    })

    it("should reject if not osubscription payee", async () => {
      await expect(subscriptionRegistry.pauseSubscription(subscription)).to.be
        .rejected
    })

    it("should reject if subscription not registered", async () => {
      await expect(
        subscriptionRegistry.pauseSubscription(ZERO_ADDRESS, {
          from: SUBSCRIPTION_PAYEE,
        })
      ).to.be.rejected
    })
  })

  describe("unpauseSubscription", () => {
    let subscription

    beforeEach(async () => {
      const tx = await subscriptionRegistry.createSubscription(
        testToken.address,
        100,
        1000,
        {
          from: SUBSCRIPTION_PAYEE,
        }
      )

      const { logs } = tx
      subscription = logs[0].args.subscription

      await subscriptionRegistry.pauseSubscription(subscription, {
        from: SUBSCRIPTION_PAYEE,
      })
    })

    it("should unpause", async () => {
      const tx = await subscriptionRegistry.unpauseSubscription(subscription, {
        from: SUBSCRIPTION_PAYEE,
      })

      const { logs } = tx

      assert.equal(logs[0].event, "SubscriptionUnpaused")
      assert.equal(logs[0].args.subscription, subscription)
    })

    it("should reject if not osubscription payee", async () => {
      await expect(subscriptionRegistry.unpauseSubscription(subscription)).to.be
        .rejected
    })

    it("should reject if subscription not registered", async () => {
      await expect(
        subscriptionRegistry.unpauseSubscription(ZERO_ADDRESS, {
          from: SUBSCRIPTION_PAYEE,
        })
      ).to.be.rejected
    })
  })

  describe("subscribe", () => {
    let subscription

    beforeEach(async () => {
      const tx = await subscriptionRegistry.createSubscription(
        testToken.address,
        100,
        1000,
        {
          from: SUBSCRIPTION_PAYEE,
        }
      )

      const { logs } = tx
      subscription = logs[0].args.subscription
    })

    it("should subscribe", async () => {
      const tx = await subscriptionRegistry.subscribe(subscription, {
        from: SUBSCRIBER,
      })

      const { logs } = tx

      assert.equal(logs[0].event, "Subscribed")
      assert.equal(logs[0].args.subscription, subscription)
      assert.equal(logs[0].args.payee, SUBSCRIPTION_PAYEE)
      assert.equal(logs[0].args.subscriber, SUBSCRIBER)
    })

    it("should reject if subscription not registered", async () => {
      await expect(
        subscriptionRegistry.subscribe(ZERO_ADDRESS, {
          from: SUBSCRIBER,
        })
      ).to.be.rejected
    })
  })

  describe("unsubscribe", () => {
    let subscription

    beforeEach(async () => {
      const tx = await subscriptionRegistry.createSubscription(
        testToken.address,
        100,
        1000,
        {
          from: SUBSCRIPTION_PAYEE,
        }
      )

      const { logs } = tx
      subscription = logs[0].args.subscription

      await subscriptionRegistry.subscribe(subscription, {
        from: SUBSCRIBER,
      })
    })

    it("should unsubscribe", async () => {
      const tx = await subscriptionRegistry.unsubscribe(subscription, {
        from: SUBSCRIBER,
      })

      const { logs } = tx

      assert.equal(logs[0].event, "Unsubscribed")
      assert.equal(logs[0].args.subscription, subscription)
      assert.equal(logs[0].args.payee, SUBSCRIPTION_PAYEE)
      assert.equal(logs[0].args.subscriber, SUBSCRIBER)
    })

    it("should reject if subscription not registered", async () => {
      await expect(
        subscriptionRegistry.unsubscribe(ZERO_ADDRESS, {
          from: SUBSCRIBER,
        })
      ).to.be.rejected
    })
  })

  describe("registerBounty", () => {
    // TODO refactor
    let subscription

    beforeEach(async () => {
      const tx = await subscriptionRegistry.createSubscription(
        testToken.address,
        100,
        1000,
        {
          from: SUBSCRIPTION_PAYEE,
        }
      )

      const { logs } = tx
      subscription = logs[0].args.subscription
    })

    it("should register", async () => {
      const tx = await subscriptionRegistry.registerBounty(subscription, 1, {
        from: SUBSCRIPTION_PAYEE,
      })

      const { logs } = tx

      assert.equal(logs[0].event, "BountyRegistered")
      assert.equal(logs[0].args.subscription, subscription)
    })

    it("should reject if not subscription payee", async () => {
      await expect(subscriptionRegistry.registerBounty(subscription, 1)).to.be
        .rejected
    })

    it("should reject if subscription not registered", async () => {
      await expect(
        subscriptionRegistry.registerBounty(ZERO_ADDRESS, {
          from: SUBSCRIPTION_PAYEE,
        })
      ).to.be.rejected
    })
  })

  describe("unregisterBounty", () => {
    // TODO refactor
    let subscription

    beforeEach(async () => {
      const tx = await subscriptionRegistry.createSubscription(
        testToken.address,
        100,
        1000,
        {
          from: SUBSCRIPTION_PAYEE,
        }
      )

      const { logs } = tx
      subscription = logs[0].args.subscription

      await subscriptionRegistry.registerBounty(subscription, 1, {
        from: SUBSCRIPTION_PAYEE,
      })
    })

    it("should unregister", async () => {
      const tx = await subscriptionRegistry.unregisterBounty(subscription, {
        from: SUBSCRIPTION_PAYEE,
      })

      const { logs } = tx

      assert.equal(logs[0].event, "BountyUnregistered")
      assert.equal(logs[0].args.subscription, subscription)
    })

    it("should reject if not subscription payee", async () => {
      await expect(subscriptionRegistry.unregisterBounty(subscription, 1)).to.be
        .rejected
    })

    it("should reject if subscription not registered", async () => {
      await expect(
        subscriptionRegistry.unregisterBounty(ZERO_ADDRESS, {
          from: SUBSCRIPTION_PAYEE,
        })
      ).to.be.rejected
    })
  })
})
