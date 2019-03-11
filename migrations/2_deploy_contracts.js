var Set = artifacts.require("./Set.sol")
var SubscriptionRegistry = artifacts.require("./SubscriptionRegistry.sol")
var PaymentBounty = artifacts.require("./PaymentBounty.sol")
var Subscription = artifacts.require("./Subscription.sol")

module.exports = function(deployer) {
  deployer.deploy(Set)
  deployer.link(Set, [SubscriptionRegistry, PaymentBounty, Subscription])
  deployer.deploy(PaymentBounty)
  deployer.deploy(SubscriptionRegistry)
}
