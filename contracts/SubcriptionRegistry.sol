pragma solidity 0.5.8;

import "./Subscription.sol";

contract SubscriptionRegistry {
  event SubscriptionCreated(
    address indexed subscription,
    address indexed owner,
    address indexed token,
    uint bounty
  );

  function create(address token, uint amount, uint interval, uint bounty)
    public
  {
    Subscription subscription = new Subscription(token, amount, interval, bounty);

    subscription.transferOwnership(msg.sender);

    emit SubscriptionCreated(address(subscription), msg.sender, token, bounty);
  }
}
