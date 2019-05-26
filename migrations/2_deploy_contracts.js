var SubscriptionRegistry = artifacts.require("./SubscriptionRegistry.sol")

module.exports = async function(deployer) {
  await deployer.deploy(SubscriptionRegistry)
}
