var SubscriptionRegistry = artifacts.require("./SubscriptionRegistry.sol")
var PaymentBounty = artifacts.require("./PaymentBounty.sol")

module.exports = async function(deployer) {
  await deployer.deploy(PaymentBounty)
  await deployer.deploy(SubscriptionRegistry, PaymentBounty.address)

  // transfer PaymentBounty ownership
  const paymentBounty = await PaymentBounty.deployed()
  const subscriptionRegistry = await SubscriptionRegistry.deployed()

  await paymentBounty.transferOwnership(subscriptionRegistry.address)
}
