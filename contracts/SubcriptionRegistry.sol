pragma solidity 0.5.2;

import "./Subscription.sol";

contract SubscriptionRegistry {
  event SubscriptionCreated(
    address indexed subscription,
    address indexed owner,
    address indexed token
  );

  address[] public subscriptions;

  function create(address token, uint interval, uint amount) public {
    Subscription subscription = new Subscription(
      msg.sender, token, amount, interval
    );

    subscriptions.append(subscription);

    emit SubscriptionCreated(address(subscription), msg.sender, token);
  }

  // TODO get subscription count
  // TODO get subscriptions
}
