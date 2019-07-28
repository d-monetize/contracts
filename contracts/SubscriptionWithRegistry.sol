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
    require(
      _subscriptionRegistry != address(0),
      "invalid subscription registry address"
    );

    subscriptionRegistry = SubscriptionRegistry(_subscriptionRegistry);
  }

  function subscribe() public {
    super.subscribe();
    subscriptionRegistry.addSubscriber(msg.sender);
  }

  function unsubscribe() public {
    super.unsubscribe();
    subscriptionRegistry.removeSubscriber(msg.sender);
  }

  function kill() public onlyOwner {
    subscriptionRegistry.removeSubscription();
    selfdestruct(msg.sender);
  }
}
