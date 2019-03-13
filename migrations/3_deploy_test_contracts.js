var TestToken = artifacts.require("./TestToken.sol")

module.exports = function(deployer, network) {
  if (network !== "main") {
    deployer.deploy(TestToken)
  }
}
