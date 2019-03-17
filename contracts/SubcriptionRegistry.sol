pragma solidity 0.5.2;

import "./Subscription.sol";
import "./PaymentBounty.sol";

contract SubscriptionRegistry {
  event SubscriptionCreated(
    address indexed payee,
    address indexed subscription,
    address indexed token,
    uint amount,
    uint interval
  );
  event SubscriptionDeleted(
    address indexed payee,
    address indexed subscription
  );
  event SubscriptionPaused(address indexed subscription);
  event SubscriptionUnpaused(address indexed subscription);
  event Subscribed(
    address indexed payee,
    address indexed subscription,
    address indexed subscriber
  );
  event Unsubscribed(
    address indexed payee,
    address indexed subscription,
    address indexed subscriber
  );
  event BountyRegistered(address indexed subscription);
  event BountyUnregistered(address indexed subscription);

  PaymentBounty public paymentBounty;

  mapping(address => address) public ownerOf;

  constructor(address _paymentBounty) public {
    paymentBounty = PaymentBounty(_paymentBounty);
  }

  modifier onlyPayee(address payee, address subscription) {
    require(
      ownerOf[subscription] == payee,
      "Not the payee of subscripiton"
    );
    _;
  }

  modifier onlyRegistered(address subscription) {
    require(isRegistered(subscription), "Subscription is not registered");
    _;
  }

  function isRegistered(address subscription) public view returns (bool) {
    return ownerOf[subscription] != address(0);
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
    onlyPayee(msg.sender, subscription)
  {
    Subscription sub = Subscription(subscription);

    delete ownerOf[subscription];
    sub.kill();

    if (paymentBounty.isRegistered(subscription)) {
      paymentBounty.unregister(subscription);
    }

    emit SubscriptionDeleted(msg.sender, subscription);
  }

  function pauseSubscription(address subscription)
    public
    onlyPayee(msg.sender, subscription)
  {
    Subscription sub = Subscription(subscription);
    sub.pause();

    emit SubscriptionPaused(subscription);
  }

  function unpauseSubscription(address subscription)
    public
    onlyPayee(msg.sender, subscription)
  {
    Subscription sub = Subscription(subscription);
    sub.unpause();

    emit SubscriptionUnpaused(subscription);
  }

  function subscribe(address subscription) public onlyRegistered(subscription) {
    Subscription sub = Subscription(subscription);

    sub.subscribe(msg.sender);

    emit Subscribed(sub.payee(), subscription, msg.sender);
  }

  function unsubscribe(address subscription)
    public
    onlyRegistered(subscription)
  {
    Subscription sub = Subscription(subscription);

    sub.unsubscribe(msg.sender);

    emit Unsubscribed(sub.payee(), subscription, msg.sender);
  }

  function registerBounty(address subscription, uint reward)
    public
    onlyPayee(msg.sender, subscription)
  {
    paymentBounty.register(subscription, reward);

    emit BountyRegistered(subscription);
  }

  function unregisterBounty(address subscription)
    public
    onlyPayee(msg.sender, subscription)
  {
    paymentBounty.unregister(subscription);

    emit BountyUnregistered(subscription);
  }
}
