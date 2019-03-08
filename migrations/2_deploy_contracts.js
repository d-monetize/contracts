var SubscriptionRegistry = artifacts.require("./SubscriptionRegistry.sol")

module.exports = function(deployer) {
  deployer.deploy(SubscriptionRegistry)
}
