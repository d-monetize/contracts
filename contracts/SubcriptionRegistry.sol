pragma solidity 0.5.2;

import "./lib/Set.sol";
import "./PaymentBounty.sol";
import "./Subscription.sol";

contract SubscriptionRegistry {
  using Set for Set.AddressSet;

  event SubscriptionCreated(address indexed owner, address indexed subscription);
  event SubscriptionDeleted(address indexed owner, address indexed subscription);
  event Subscribed(address indexed subscription, address indexed subscriber);
  event Unsubscribed(address indexed subscription, address indexed subscriber);

  PaymentBounty public paymentBounty = new PaymentBounty();

  mapping(address => Set.AddressSet) private ownerToSubs;
  mapping(address => Set.AddressSet) private subscriberToSubs;
  mapping(address => bool) public deletedSubs;

  modifier onlyRegistered(address subscription) {
    require(
      Subscription(subscription).owner() == this,
      "Subscription is not registered"
    );
    _;
  }

  modifier onlySubscriptionOwner(address owner, address subscription) {
    require(
      ownerToSubs[owner].has(subscription),
      "Not the owner of subscripiton"
    );
    _;
  }

  function createSubscription() public {
    Subscription sub = new Subscription();

    address subscription = address(sub);

    ownerToSubs[msg.sender].add(subscription);

    emit SubscriptionCreated(msg.sender, subscription);
  }

  function deleteSubscription(address subscription)
    public
    onlyRegistered(subscription)
    onlySubscriptionOwner(msg.sender, subscription)
  {
    Subscription sub = Subscription(subscription);

    ownerToSubs[msg.sender].remove(subscription);
    deletedSubs[subscription] = true;
    // TODO error handle when kill fails
    sub.kill();

    if (paymentBounty.bountyExists(subscription)) {
      paymentBounty.unregister(subscription);
    }

    emit SubscriptionDeleted(msg.sender, subscription);
  }

  function pauseSubscription(address subscription)
    public
    onlyRegistered(subscription)
    onlySubscriptionOwner(msg.sender, subscription)
  {
    Subscription sub = Subscription(subscription);
    sub.pause();
  }

  function unpauseSubscription(address subscription)
    public
    onlyRegistered(subscription)
    onlySubscriptionOwner(msg.sender, subscription)
  {
    Subscription sub = Subscription(subscription);
    sub.unpause();
  }

  function subscribe(address subscription) public onlyRegistered(subscription) {
    require(
      !subscriberToSubs[msg.sender].has(subscription),
      "Already subscribed"
    );

    Subscription sub = Subscription(subscription);

    subscriberToSubs[msg.sender].add(subscription);
    sub.subscribe(msg.sender);

    emit Subscribed(subscription, msg.sender);
  }

  function unsubscribe(address subscription) public {
    // TODO what happens if contract is initialized at non- existing contract address
    Subscription sub = Subscription(subscription);

    require(
      sub.owner() == address(this) || deletedSubs[subscription],
      "Subscription not registered nor deleted"
    );

    require(subscriberToSubs[msg.sender].has(subscription), "Not subscribed");

    subscriberToSubs[msg.sender].remove(subscription);

    if (!deletedSubs[subscription]) {
      sub.unsubscribe(msg.sender);
    }

    emit Unsubscribed(subscription, msg.sender);
  }

  function registerBounty(address subscription, uint reward)
    public
    onlyRegistered(subscription)
    onlySubscriptionOwner(msg.sender, subscription)
  {
    paymentBounty.register(subscription, reward);
  }

  function unregisterBounty(address subscription)
    public
    onlyRegistered(subscription)
    onlySubscriptionOwner(msg.sender, subscription)
  {
    paymetnBounty.unregister(subscription);
  }

  function getSubscriptionByOwnerCount(address owner)
    public
    view
    returns (uint)
  {
    return ownerToSubs[owner].length();
  }

  function getSubscriptionByOwner(address owner, uint index)
    public
    view
    returns (address)
  {
    return ownerToSubs[owner].get(index);
  }

  function getSubscriptionBySubscriberCount(address subscriber)
    public
    view
    returns (uint)
  {
    return subcriberToSubs[subscriber].length();
  }

  function getSubscriptionBySubscriber(address subscriber, uint index)
    public
    view
    returns (address)
  {
    return subscriberToSubs[owner].get(index);
  }
}
