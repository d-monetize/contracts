var SubscriptionRegistry = artifacts.require("./SubscriptionRegistry.sol")
var PaymentBounty = artifacts.require("./PaymentBounty.sol")

module.exports = function(deployer) {
  deployer.deploy(PaymentBounty)
  deployer.deploy(SubscriptionRegistry)
}
