pragma solidity 0.5.8;

import "./Subscription.sol";

contract SubscriptionFactory {
  event SubscriptionCreated(
    address indexed subscription,
    address indexed owner,
    address indexed token,
    uint amount,
    uint interval,
    uint bounty
  );

  function create(address _token, uint _amount, uint _interval, uint _bounty)
    public
  {
    Subscription subscription = new Subscription(
      _token,
      _amount,
      _interval,
      _bounty
    );

    subscription.transferOwnership(msg.sender);

    emit SubscriptionCreated(
      address(subscription), msg.sender, _token, _amount, _interval, _bounty
    );
  }
}
