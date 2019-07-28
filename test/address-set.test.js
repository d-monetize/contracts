const chai = require("chai")
chai.use(require("chai-as-promised"))
chai.use(require("chai-bignumber")())

const expect = chai.expect

const { ZERO_ADDRESS, web3 } = require("./util")

const TestAddressSet = artifacts.require("TestAddressSet")

contract("AddressSet", accounts => {
  let addressSet
  beforeEach(async () => {
    addressSet = await TestAddressSet.new()
  })

  describe("add", () => {
    it("should add", async () => {
      await addressSet.add(accounts[0])

      assert.equal(await addressSet.count(), 1)
      assert.equal(await addressSet.get(0), accounts[0])

      assert.equal(await addressSet.contains(accounts[0]), true)
    })

    it("should reject if already added", async () => {
      await addressSet.add(accounts[0])

      await expect(addressSet.add(accounts[0])).to.be.rejected
    })
  })

  describe("remove", () => {
    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        await addressSet.add(accounts[i])
      }
    })

    it("should remove", async () => {
      await addressSet.remove(accounts[1])

      assert.equal(await addressSet.count(), 2)
      assert.equal(await addressSet.get(0), accounts[0])
      assert.equal(await addressSet.get(1), accounts[2])

      assert.equal(await addressSet.contains(accounts[1]), false)
    })

    it("should reject if not added", async () => {
      await addressSet.remove(accounts[1])
      await expect(addressSet.remove(accounts[1])).to.be.rejected
    })
  })

  describe("get", () => {
    beforeEach(async () => {
      await addressSet.add(accounts[0])
    })

    it("should get", async () => {
      assert.equal(await addressSet.get(0), accounts[0])
    })

    it("should reject if index out of bounds", async () => {
      await expect(addressSet.get(accounts[1])).to.be.rejected
    })
  })

  describe("count", () => {
    beforeEach(async () => {
      for (let i = 0; i < 3; i++) {
        await addressSet.add(accounts[i])
      }
    })

    it("should get count", async () => {
      assert.equal(await addressSet.count(), 3)
    })
  })
})
