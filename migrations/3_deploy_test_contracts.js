var TestAddressSet = artifacts.require("./TestAddressSet.sol")
var TestToken = artifacts.require("./TestToken.sol")

module.exports = function(deployer, network) {
  if (network !== "main") {
    deployer.deploy(TestAddressSet)
    deployer.deploy(TestToken)
  }
}
