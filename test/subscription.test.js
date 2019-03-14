const chai = require("chai")
chai.use(require("chai-as-promised"))
chai.use(require("chai-bignumber")())

const expect = chai.expect

const { ZERO_ADDRESS, web3 } = require("./util")

const ScamToken = artifacts.require("ScamToken")
const TestToken = artifacts.require("TestToken")
const Subscription = artifacts.require("Subscription")

contract("Subscription", accounts => {
  const PRIMARY = accounts[0]
  const OWNER = accounts[1]
  const AMOUNT = 10
  const INTERVAL = 100

  let testToken
  beforeEach(async () => {
    testToken = await TestToken.new()
  })

  function newSubscription(params = {}) {
    const {
      owner = OWNER,
      amount = AMOUNT,
      interval = INTERVAL,
      token = testToken,
      from = PRIMARY,
    } = params

    return Subscription.new(owner, token.address, amount, interval, { from })
  }

  describe("constructor", () => {
    it("should initialize", async () => {
      const subscription = await newSubscription()

      assert.equal(await subscription.primary(), PRIMARY, "primary mismatch")
      assert.equal(await subscription.owner(), OWNER, "owner mismatch")
      assert.equal(
        await subscription.token(),
        testToken.address,
        "token mismatch"
      )
      assert.equal(await subscription.amount(), AMOUNT, "amount mismatch")
      assert.equal(await subscription.interval(), INTERVAL, "interval mismatch")
    })

    it("should reject if owner is zero address", async () => {
      await expect(newSubscription({ owner: ZERO_ADDRESS })).to.be.rejected
    })

    it("should reject if token is zero address", async () => {
      await expect(newSubscription({ token: { address: ZERO_ADDRESS } })).to.be
        .rejected
    })

    it("should reject if amount is 0", async () => {
      await expect(newSubscription({ amount: 0 })).to.be.rejected
    })

    it("should reject if interval is 0", async () => {
      await expect(newSubscription({ interval: 0 })).to.be.rejected
    })

    it("should reject if interval greater than 99 weeks", async () => {
      await expect(newSubscription({ interval: 100 * 7 * 24 * 3600 })).to.be
        .rejected
    })
  })

  describe("subscribe", () => {
    let subscription
    beforeEach(async () => {
      subscription = await newSubscription()
    })

    it("should subscribe", async () => {
      const subscriber = accounts[2]
      const tx = await subscription.subscribe(subscriber)

      const { logs } = tx

      const block = await web3.eth.getBlock(tx.receipt.blockNumber)

      assert.equal(logs[0].event, "Subscribed")
      assert.equal(logs[0].args.subscriber, subscriber)
      assert.equal(logs[0].args.nextPaymentAt, block.timestamp)

      assert.equal(await subscription.isSubscribed(subscriber), true)
    })

    it("should reject if not primary", async () => {
      await expect(subscription.subscribe(accounts[2], { from: accounts[2] }))
        .to.be.rejected
    })

    it("should reject when paused", async () => {
      await subscription.pause()
      await expect(subscription.subscribe(accounts[2])).to.be.rejected
    })

    it("should reject if already subscribed", async () => {
      await subscription.subscribe(accounts[2])
      await expect(subscription.subscribe(accounts[2])).to.be.rejected
    })

    it("should reject if address 0", async () => {
      await expect(subscription.subscribe(ZERO_ADDRESS)).to.be.rejected
    })
  })

  describe("unsubscribe", () => {
    let subscription
    const subscriber = accounts[2]

    beforeEach(async () => {
      subscription = await newSubscription()
      await subscription.subscribe(subscriber)
    })

    it("should unsubscribe", async () => {
      const tx = await subscription.unsubscribe(subscriber)

      const { logs } = tx

      assert.equal(logs[0].event, "Unsubscribed")
      assert.equal(logs[0].args.subscriber, subscriber)
      assert.equal(await subscription.isSubscribed(subscriber), false)
    })

    it("should reject if not primary", async () => {
      await expect(subscription.unsubscribe(subscriber, { from: subscriber }))
        .to.be.rejected
    })

    it("should reject when paused", async () => {
      await subscription.pause()
      await expect(subscription.subscribe(subscriber)).to.be.rejected
    })

    it("should reject if not subscribed", async () => {
      await subscription.unsubscribe(subscriber)
      await expect(subscription.unsubscribe(subscriber)).to.be.rejected
    })
  })

  describe("processPayment", () => {
    let subscription
    const subscriber = accounts[2]

    beforeEach(async () => {
      subscription = await newSubscription()

      await subscription.subscribe(subscriber)

      await testToken.mint(100, { from: subscriber })
      await testToken.approve(subscription.address, 100, {
        from: subscriber,
      })
    })

    it("should process payment", async () => {
      const tx = await subscription.processPayment(subscriber)
      const { logs } = tx
      const block = await web3.eth.getBlock(tx.receipt.blockNumber)

      assert.equal(logs[0].event, "PaymentProcessed")
      assert.equal(logs[0].args.subscriber, subscriber)
      assert.equal(logs[0].args.nextPaymentAt, block.timestamp + INTERVAL)

      assert.equal(await subscription.canProcessPayment(subscriber), false)
    })

    it("should reject when paused", async () => {
      await subscription.pause()
      await expect(subscription.processPayment(subscriber)).to.be.rejected
    })

    it("should reject if not subscribed", async () => {
      await expect(subscription.processPayment(accounts[3])).to.be.rejected
    })

    it("should reject if nextPaymentAt < block.timestamp", async () => {
      await subscription.processPayment(subscriber)
      await expect(subscription.processPayment(subscriber)).to.be.rejected
    })

    it("should reject if allowance < amount", async () => {
      await testToken.approve(subscription.address, 0, {
        from: subscriber,
      })
      await expect(subscription.processPayment(subscriber)).to.be.rejected
    })

    it("should reject if balance < amount", async () => {
      await testToken.burn(100, {
        from: subscriber,
      })
      await expect(subscription.processPayment(subscriber)).to.be.rejected
    })

    it("should reject if amount not transfered", async () => {
      const token = await ScamToken.new()
      const subscription = await newSubscription({ token })

      await subscription.subscribe(accounts[2])

      await token.mint(100, { from: subscriber })
      await token.approve(subscription.address, 100, {
        from: subscriber,
      })

      await expect(subscription.processPayment(subscriber)).to.be.rejected
    })
  })

  describe("pause", () => {
    let subscription

    beforeEach(async () => {
      subscription = await newSubscription()
    })

    it("should pause", async () => {
      await subscription.pause()
      assert.equal(await subscription.paused(), true)
    })

    it("should reject if not primary", async () => {
      await expect(subscription.pause({ from: accounts[1] })).to.be.rejected
    })
  })

  describe("unpause", () => {
    let subscription

    beforeEach(async () => {
      subscription = await newSubscription()
      await subscription.pause()
    })

    it("should unpause", async () => {
      await subscription.unpause()

      assert.equal(await subscription.paused(), false)
    })

    it("should reject if not primary", async () => {
      await expect(subscription.unpause({ from: accounts[1] })).to.be.rejected
    })
  })

  describe("kill", () => {
    let subscription

    beforeEach(async () => {
      subscription = await newSubscription()
    })

    it("should kill", async () => {
      await subscription.kill()
      await expect(subscription.owner()).to.be.rejected
    })

    it("should reject if not primary", async () => {
      await expect(subscription.kill({ from: accounts[1] })).to.be.rejected
    })
  })
})
