const chai = require("chai")
chai.use(require("chai-as-promised"))
chai.use(require("chai-bignumber")())

const expect = chai.expect

const { ZERO_ADDRESS, web3, newSubscription } = require("./util")

const ScamToken = artifacts.require("ScamToken")
const TestToken = artifacts.require("TestToken")
const Subscription = artifacts.require("Subscription")
const PaymentBounty = artifacts.require("PaymentBounty")

contract("PaymentBounty", accounts => {
  const OWNER = accounts[0]
  const SUBSCRIPTION_PAYEE = accounts[1]
  const SUBSCRIBER = accounts[2]
  const BOUNTY_CLAIMER = accounts[3]

  let subscription
  let testToken
  let paymentBounty
  beforeEach(async () => {
    testToken = await TestToken.new()
    subscription = await newSubscription(accounts, {
      owner: OWNER,
      payee: SUBSCRIPTION_PAYEE,
      token: testToken,
    })

    paymentBounty = await PaymentBounty.new()
  })

  describe("register", () => {
    it("should register", async () => {
      const tx = await paymentBounty.register(subscription.address, 1)

      const { logs } = tx

      assert.equal(logs[0].event, "BountyRegistered")
      assert.equal(logs[0].args.subscription, subscription.address)
      assert.equal(logs[0].args.token, await subscription.token())
      assert.equal(logs[0].args.reward, 1)

      assert.equal(await paymentBounty.isRegistered(subscription.address), true)
    })

    it("should reject if not owner", async () => {
      await expect(
        paymentBounty.register(subscription.address, 1, { from: accounts[2] })
      ).to.be.rejected
    })

    it("should reject if already registered", async () => {
      await paymentBounty.register(subscription.address, 1)

      await expect(paymentBounty.register(subscription.address, 1)).to.be
        .rejected
    })

    it("should reject subscription if does not exist", async () => {
      await expect(paymentBounty.register(ZERO_ADDRESS, 1)).to.be.rejected
    })

    it("should reject if reward is 0", async () => {
      await expect(paymentBounty.register(subscription.address, 0)).to.be
        .rejected
    })

    it("should reject if reward > subscription amount", async () => {
      await expect(paymentBounty.register(subscription.address, 1000)).to.be
        .rejected
    })
  })

  describe("unregister", () => {
    beforeEach(async () => {
      await paymentBounty.register(subscription.address, 1)
    })

    it("should unregister", async () => {
      const tx = await paymentBounty.unregister(subscription.address)

      const { logs } = tx

      assert.equal(logs[0].event, "BountyUnregistered")
      assert.equal(logs[0].args.subscription, subscription.address)

      assert.equal(
        await paymentBounty.isRegistered(subscription.address),
        false
      )
    })

    it("should reject if not owner", async () => {
      await expect(
        paymentBounty.unregister(subscription.address, { from: accounts[2] })
      ).to.be.rejected
    })

    it("should reject if not registered", async () => {
      await expect(paymentBounty.unregister(ZERO_ADDRESS)).to.be.rejected
    })
  })

  describe("claimBounty", () => {
    beforeEach(async () => {
      // subscription setup
      await subscription.subscribe(SUBSCRIBER)

      await testToken.mint(100, { from: SUBSCRIBER })
      await testToken.approve(subscription.address, 100, {
        from: SUBSCRIBER,
      })

      // bounty setup
      await paymentBounty.register(subscription.address, 1)
      await testToken.approve(paymentBounty.address, 100, {
        from: SUBSCRIPTION_PAYEE,
      })
    })

    it("should claim bounty", async () => {
      const tx = await paymentBounty.claimBounty(
        subscription.address,
        SUBSCRIBER,
        { from: BOUNTY_CLAIMER }
      )

      const { logs } = tx

      assert.equal(logs[0].event, "BountyClaimed")
      assert.equal(logs[0].args.subscription, subscription.address)
      assert.equal(logs[0].args.subscriber, SUBSCRIBER)
      assert.equal(logs[0].args.token, await subscription.token())
      assert.equal(logs[0].args.reward, 1)

      assert.equal(
        await paymentBounty.canClaimBounty(subscription.address, SUBSCRIBER),
        false,
        "Expected canClaimBounty to return false"
      )
    })

    it("should reject if not registered", async () => {
      await expect(
        paymentBounty.claimBounty(subscription.address, ZERO_ADDRESS)
      ).to.be.rejected
    })

    it("should reject if subscription does not exist", async () => {
      await expect(paymentBounty.claimBounty(ZERO_ADDRESS, SUBSCRIBER)).to.be
        .rejected
    })

    it("should reject if allowance < reward", async () => {
      await testToken.approve(paymentBounty.address, 0, {
        from: SUBSCRIPTION_PAYEE,
      })
      await expect(paymentBounty.claimBounty(subscription.address, SUBSCRIBER))
        .to.be.rejected
    })

    it("should reject if subscription cannot be processed ", async () => {
      await testToken.approve(subscription.address, 0, { from: SUBSCRIBER })
      await expect(
        paymentBounty.claimBounty(subscription.address, ZERO_ADDRESS)
      ).to.be.rejected
    })

    it("should reject if amount not transfered", async () => {
      // subscription setup
      const token = await ScamToken.new()
      const subscription = await newSubscription(accounts, {
        owner: OWNER,
        payee: SUBSCRIPTION_PAYEE,
        token,
      })
      await subscription.subscribe(SUBSCRIBER)

      await token.mint(100, { from: SUBSCRIBER })
      await token.approve(subscription.address, 100, {
        from: SUBSCRIBER,
      })

      // bounty setup
      await paymentBounty.register(subscription.address, 1)
      await token.approve(paymentBounty.address, 100, {
        from: SUBSCRIPTION_PAYEE,
      })

      assert.equal(
        await paymentBounty.canClaimBounty(subscription.address, SUBSCRIBER),
        true
      )
      await expect(paymentBounty.claimBounty(subscription.address, SUBSCRIBER))
        .to.be.rejected
    })
  })
})
