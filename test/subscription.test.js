const chai = require("chai")
chai.use(require("chai-as-promised"))
chai.use(require("chai-bignumber")())

const expect = chai.expect

const { ZERO_ADDRESS, web3 } = require("./util")

const TestToken = artifacts.require("TestToken")
const Subscription = artifacts.require("Subscription")

contract("Subscription", accounts => {
  const OWNER = accounts[0]
  const AMOUNT = 10
  const INTERVAL = 3600
  const BOUNTY = 1

  let testToken
  beforeEach(async () => {
    testToken = await TestToken.new()
  })

  function newSubscription(params = {}) {
    const {
      owner = OWNER,
      amount = AMOUNT,
      interval = INTERVAL,
      bounty = BOUNTY,
      token = testToken.address,
    } = params

    return Subscription.new(token, amount, interval, bounty, {
      from: owner,
    })
  }

  describe("constructor", () => {
    it("should initialize", async () => {
      const subscription = await newSubscription()

      assert.equal(await subscription.owner(), OWNER, "owner mismatch")
      assert.equal(
        await subscription.token(),
        testToken.address,
        "token mismatch"
      )
      assert.equal(await subscription.amount(), AMOUNT, "amount mismatch")
      assert.equal(await subscription.interval(), INTERVAL, "interval mismatch")
      assert.equal(await subscription.bounty(), BOUNTY, "bounty mismatch")
    })

    it("should reject if token is zero address", async () => {
      await expect(newSubscription({ token: ZERO_ADDRESS })).to.be.rejected
    })

    it("should reject if amount is 0", async () => {
      await expect(newSubscription({ amount: 0 })).to.be.rejected
    })

    it("should reject if interval is 0", async () => {
      await expect(newSubscription({ interval: 0 })).to.be.rejected
    })

    it("should reject if interval is greater than 100 days", async () => {
      await expect(newSubscription({ interval: 3600 * 24 * 100 + 1 })).to.be
        .rejected
    })

    it("should reject if bounty > amount", async () => {
      await expect(newSubscription({ amount: 100, bounty: 101 })).to.be.rejected
    })
  })

  describe("updateBounty", () => {
    let subscription

    beforeEach(async () => {
      subscription = await newSubscription()
    })

    it("should update", async () => {
      await subscription.updateBounty(20)
      assert.equal(await subscription.bounty(), 20)
    })

    it("should reject if not owner", async () => {
      await expect(subscription.updateBounty(20, { from: accounts[1] })).to.be
        .rejected
    })

    it("should reject if paused", async () => {
      await subscription.pause()
      await expect(subscription.updateBounty(20)).to.be.rejected
    })
  })

  describe("subscribe", () => {
    let subscription
    beforeEach(async () => {
      subscription = await newSubscription()
    })

    it("should subscribe", async () => {
      const subscriber = accounts[2]
      const tx = await subscription.subscribe({ from: subscriber })

      const { logs } = tx

      const block = await web3.eth.getBlock(tx.receipt.blockNumber)

      assert.equal(logs[0].event, "Subscribed")
      assert.equal(logs[0].args.subscriber, subscriber)

      assert.equal(await subscription.nextPayments(subscriber), block.timestamp)
      assert.equal(await subscription.isSubscribed(subscriber), true)
    })

    it("should reject when paused", async () => {
      await subscription.pause()
      await expect(subscription.subscribe({ from: accounts[2] })).to.be.rejected
    })

    it("should reject if already subscribed", async () => {
      await subscription.subscribe({ from: accounts[2] })
      await expect(subscription.subscribe({ from: accounts[2] })).to.be.rejected
    })
  })

  describe("unsubscribe", () => {
    let subscription
    const subscriber = accounts[2]

    beforeEach(async () => {
      subscription = await newSubscription()
      await subscription.subscribe({ from: subscriber })
    })

    it("should unsubscribe", async () => {
      const tx = await subscription.unsubscribe({ from: subscriber })

      const { logs } = tx

      assert.equal(logs[0].event, "Unsubscribed")
      assert.equal(logs[0].args.subscriber, subscriber)

      assert.equal(await subscription.nextPayments(subscriber), 0)
      assert.equal(await subscription.isSubscribed(subscriber), false)
    })

    it("should reject when paused", async () => {
      await subscription.pause()
      await expect(subscription.unsubscribe({ from: subscriber })).to.be
        .rejected
    })

    it("should reject if not subscribed", async () => {
      await subscription.unsubscribe({ from: subscriber })
      await expect(subscription.unsubscribe({ from: subscriber })).to.be
        .rejected
    })
  })

  describe("charge", () => {
    let subscription
    const subscriber = accounts[2]

    beforeEach(async () => {
      subscription = await newSubscription()

      await await subscription.subscribe({ from: subscriber })

      // approval to transfer from subscriber
      await testToken.mint(100, { from: subscriber })
      await testToken.approve(subscription.address, 100, {
        from: subscriber,
      })

      // approval to transfer bounty from owner
      await testToken.approve(subscription.address, 100, {
        from: OWNER,
      })
    })

    it("should charge", async () => {
      // get nextPayments before payment
      const nextPayment = await subscription.nextPayments(subscriber)

      const tx = await subscription.charge(subscriber)
      const { logs } = tx
      const block = await web3.eth.getBlock(tx.receipt.blockNumber)

      assert.equal(logs[0].event, "Charged")
      assert.equal(logs[0].args.subscriber, subscriber)
      assert.equal(
        logs[0].args.nextPayment.toNumber(),
        nextPayment.toNumber() + INTERVAL
      )

      assert.equal(await subscription.canCharge(subscriber), false)
    })

    it("should reject when paused", async () => {
      await subscription.pause()
      await expect(subscription.charge(subscriber)).to.be.rejected
    })

    it("should reject if not subscribed", async () => {
      await expect(subscription.charge(accounts[3])).to.be.rejected
    })

    it("should reject if nextPayment < block.timestamp", async () => {
      await subscription.charge(subscriber)
      await expect(subscription.charge(subscriber)).to.be.rejected
    })

    it("should reject if allowance < amount", async () => {
      await testToken.approve(subscription.address, 0, {
        from: subscriber,
      })
      await expect(subscription.charge(subscriber)).to.be.rejected
    })

    it("should reject if balance < amount", async () => {
      await testToken.burn(100, {
        from: subscriber,
      })
      await expect(subscription.charge(subscriber)).to.be.rejected
    })
  })

  describe("kill", () => {
    let subscription

    beforeEach(async () => {
      subscription = await newSubscription()
    })

    it("should kill", async () => {
      await subscription.kill()
      // check if contract is deleted
      await expect(subscription.owner()).to.be.rejected
    })

    it("should reject if not owner", async () => {
      await expect(subscription.kill({ from: accounts[1] })).to.be.rejected
    })
  })
})
