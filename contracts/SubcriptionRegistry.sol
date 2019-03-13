pragma solidity 0.5.2;

import "./Subscription.sol";

contract SubscriptionRegistry {
  event SubscriptionCreated(
    address indexed owner,
    address indexed subscription,
    address indexed token,
    uint amount,
    uint interval
  );
  event SubscriptionDeleted(
    address indexed owner,
    address indexed subscription
  );
  event SubscriptionPaused(address indexed subscription);
  event SubscriptionUnpaused(address indexed subscription);
  event Subscribed(
    address indexed owner,
    address indexed subscription,
    address indexed subscriber
  );
  event Unsubscribed(
    address indexed owner,
    address indexed subscription,
    address indexed subscriber
  );

  mapping(address => address) public ownerOf;

  modifier onlySubscriptionOwner(address owner, address subscription) {
    require(
      ownerOf[subscription] == owner,
      "Not the owner of subscripiton"
    );
    _;
  }

  modifier onlyRegistered(address subscription) {
    require(
      ownerOf[subscription] != address(0),
      "Subscription is not registered"
    );
    _;
  }

  function createSubscription(address token, uint amount, uint interval)
    public
  {
    Subscription sub = new Subscription(msg.sender, token, amount, interval);

    address subscription = address(sub);
    ownerOf[subscription] = msg.sender;

    emit SubscriptionCreated(msg.sender, subscription, token, amount, interval);
  }

  function deleteSubscription(address subscription)
    public
    onlySubscriptionOwner(msg.sender, subscription)
  {
    Subscription sub = Subscription(subscription);

    delete ownerOf[subscription];
    // TODO error handle when kill fails
    sub.kill();

    emit SubscriptionDeleted(msg.sender, subscription);
  }

  function pauseSubscription(address subscription)
    public
    onlySubscriptionOwner(msg.sender, subscription)
  {
    Subscription sub = Subscription(subscription);
    sub.pause();

    emit SubscriptionPaused(subscription);
  }

  function unpauseSubscription(address subscription)
    public
    onlySubscriptionOwner(msg.sender, subscription)
  {
    Subscription sub = Subscription(subscription);
    sub.unpause();

    emit SubscriptionUnpaused(subscription);
  }

  function subscribe(address subscription) public onlyRegistered(subscription) {
    Subscription sub = Subscription(subscription);

    sub.subscribe(msg.sender);

    emit Subscribed(sub.owner(), subscription, msg.sender);
  }

  function unsubscribe(address subscription)
    public
    onlyRegistered(subscription)
  {
    Subscription sub = Subscription(subscription);

    sub.unsubscribe(msg.sender);

    emit Unsubscribed(sub.owner(), subscription, msg.sender);
  }
}
