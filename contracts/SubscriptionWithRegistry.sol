pragma solidity 0.5.8;

import "./Subscription.sol";
import "./SubscriptionRegistry.sol";

contract SubscriptionWithRegistry is Subscription {
  SubscriptionRegistry public subscriptionRegistry;

  constructor(
    address _token, uint _amount, uint _interval, uint _bounty,
    address _subscriptionRegistry
  ) Subscription(_token, _amount, _interval, _bounty) public
  {
    subscriptionRegistry = SubscriptionRegistry(_subscriptionRegistry);
  }
}
