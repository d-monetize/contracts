var TestToken = artifacts.require("./TestToken.sol")

module.exports = function(deployer, network, accounts) {
  if (network !== "main") {
    return deployer.then(async () => {
      const testToken = await TestToken.deployed()

      await testToken.mint(1000000, { from: accounts[0] })
      await testToken.mint(1000000, { from: accounts[1] })
    })
  }
}
