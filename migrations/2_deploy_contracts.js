var SubscriptionFactory = artifacts.require("./SubscriptionFactory.sol")

module.exports = function(deployer) {
  deployer.deploy(SubscriptionFactory)
}
