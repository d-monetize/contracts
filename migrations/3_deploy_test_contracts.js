var Set = artifacts.require("./Set.sol")
var TestAddressSet = artifacts.require("./TestAddressSet.sol")
var TestToken = artifacts.require("./TestToken.sol")

module.exports = function(deployer, network) {
  if (network !== "main") {
    deployer.link(Set, TestAddressSet)
    deployer.deploy(TestAddressSet)
    deployer.deploy(TestToken)
  }
}
