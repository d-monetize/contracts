pragma solidity ^0.5.3;

import 'openzeppelin-solidity/contracts/ownership/Secondary.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import "./lib/Set.sol";
import "./Subscription.sol";

contract PaymentBounty is Secondary {
  using Set for Set.AddressSet;

  event BountyRegistered(address indexed subscription, uint reward);
  event BountyUnregistered(address indexed subscription);
  event PaymentProcessed(
    address indexed subscription,
    address indexed subscriber,
    uint reward
  );

  mapping(address => uint) rewards;
  Set.AddressSet internal subscriptions;

  modifier onlyRegistered(address subscription) {
    require(subscriptions.has(subscription), "Subscription is not registered");
    _;
  }

  modifier checkTokenBalanceAfterTransfer(address addr, uint diff) {
    uint balanceBefore = ERC20(token).balnaceOf(addr);
    _;
    uint balanceAfter = ERC20(token).balanceOf(addr);

    require(balanceAfter.sub(balanceBefore) == diff, "Check token balance failed");
  }

  function register(address subscription, uint reward) public onlyPrimary {
    require(
      !subscriptions.has(subscription),
      "Subscription is already registered"
    );

    require(
      Subscription(subscription).amount() >= reward,
      "Bounty reward cannot exceed subscription amount"
    );

    require(reward > 0, "Reward must be greater than 0");

    subscriptions.add(subscription);
    rewards[subscription] = reward;

    emit BountyRegistered(subscription, reward);
  }

  function unregister(address subscription)
    public
    onlyPrimary
    onlyRegistered(subscription)
  {
    subscriptions.remove(subscription);
    delete rewards[subscription];

    emit BountyUnregistered(subscription);
  }

  function canProcessPayment(address subscription, address subscriber)
    public
    view
    returns (bool)
  {
    if (!subscriptions.has(subscription)) {
      return false;
    }

    Subscription sub = Subscription(subscription);

    ERC20 token = ERC20(sub.token());

    uint allowance = token.allowance(sub.owner(), this);
    uint reward = rewards[subscription];

    return (
      allowance >= reward &&
      sub.canProcessPayment(subscriber)
    );
  }

  function processPayment(address subscription, address subscriber)
    public
    onlyRegistered(subscription)
    checkTokenBalanceAfterTransfer(msg.sender, rewards[subscription])
  {
    require(
      canProcessPayment(subscription, subscriber),
      "Cannot process payment"
    );

    Subscription sub = Subscription(subscription);
    ERC20 token = ERC20(sub.token());

    sub.processPayment(subscriber);

    uint reward = rewards[subscription];

    require(
      token.transferFrom(sub.owner(), msg.sender, reward),
      "token.transfer from tokenSubscription.owner to msg.sender failed"
    );

    emit PaymentProcessed(subscription, subscriber, reward);
  }

  function bountyExists(address subscription)  public view returns (uint) {
    return subscriptions.has(subscription);
  }

  function getBountyCount() public view returns (uint) {
    return subscriptions.length();
  }

  function getBounty(uint index)
    public
    view
    returns
    (address subscription, uint reward)
  {
    subscription = subscriptions.get(index);
    reward = rewards[subscription];

    return (subscription, reward);
  }
}
