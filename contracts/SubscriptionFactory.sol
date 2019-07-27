pragma solidity 0.5.8;

import "./SubscriptionRegistry.sol";
import "./SubscriptionWithRegistry.sol";

contract SubscriptionFactory {
  event SubscriptionCreated(
    address indexed subscription,
    address indexed owner,
    address indexed token,
    uint amount,
    uint interval,
    uint bounty
  );

  SubscriptionRegistry public subscriptionRegistry;

  constructor() public {
    subscriptionRegistry = new SubscriptionRegistry();
  }

  function create(address _token, uint _amount, uint _interval, uint _bounty)
    public
  {
    SubscriptionWithRegistry subscription = new SubscriptionWithRegistry(
      _token,
      _amount,
      _interval,
      _bounty,
      address(subscriptionRegistry)
    );

    subscription.transferOwnership(msg.sender);

    subscriptionRegistry.addSubscription(address(subscription), msg.sender);

    emit SubscriptionCreated(
      address(subscription), msg.sender, _token, _amount, _interval, _bounty
    );
  }
}
