pragma solidity 0.5.2;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import "./Subscription.sol";

contract PaymentBounty {
  event BountyRegistered(
    address indexed subscription, address indexed token, uint reward
  );
  event BountyUnregistered(address indexed subscription);
  event BountyClaimed(
    address indexed subscription,
    address indexed subscriber,
    address indexed token,
    uint reward
  );

  struct Bounty {
    address owner;
    uint reward;
  }

  // mapping from subscription to bounty
  mapping(address => Bounty) public bounties;

  modifier checkTokenBalanceAfterTransfer(
    address subscription, address tokenOwner
  ) {
    Subscription sub = Subscription(subscription);
    Bounty storage bounty = bounties[subscription];

    uint balanceBefore = ERC20(sub.token()).balanceOf(tokenOwner);
    _;
    uint balanceAfter = ERC20(sub.token()).balanceOf(tokenOwner);

    require(balanceAfter > balanceBefore, "Token transfer failed");

    require(
      balanceAfter - balanceBefore == bounty.reward,
      "Check token balance failed"
    );
  }

  function register(address subscription, uint reward) public {
    require(
      !isRegistered(subscription),
      "Subscription is already registered"
    );

    Subscription sub = Subscription(subscription);

    require(msg.sender == sub.owner(), "Not subscription owner");

    require(
      sub.amount() >= reward,
      "Bounty reward cannot exceed subscription amount"
    );

    require(reward > 0, "Reward must be greater than 0");

    bounties[subscription] = Bounty({
      owner: sub.owner(),
      reward: reward
    });

    emit BountyRegistered(subscription, sub.token(), reward);
  }

  function unregister(address subscription) public {
    require(isRegistered(subscription), "Subscription is not registered");

    Bounty storage bounty = bounties[subscription];

    require(msg.sender == bounty.owner, "Not subscription owner");

    delete bounties[subscription];

    emit BountyUnregistered(subscription);
  }

  function canClaimBounty(address subscription, address subscriber)
    public
    view
    returns (bool)
  {
    if (!isRegistered(subscription)) {
      return false;
    }

    // TODO if subscription does not exist return false

    Subscription sub = Subscription(subscription);

    ERC20 token = ERC20(sub.token());

    uint allowance = token.allowance(sub.owner(), address(this));
    uint reward = bounties[subscription].reward;

    return (
      allowance >= reward &&
      sub.canProcessPayment(subscriber)
    );
  }

  function claimBounty(address subscription, address subscriber)
    public
    checkTokenBalanceAfterTransfer(subscription, msg.sender)
  {
    require(
      canClaimBounty(subscription, subscriber),
      "Cannot process payment"
    );

    Subscription sub = Subscription(subscription);
    ERC20 token = ERC20(sub.token());

    sub.processPayment(subscriber);

    uint reward = bounties[subscription].reward;

    require(
      token.transferFrom(sub.owner(), msg.sender, reward),
      "token.transfer from tokenSubscription.owner to msg.sender failed"
    );

    emit BountyClaimed(subscription, subscriber, address(token), reward);
  }

  function isRegistered(address subscription)  public view returns (bool) {
    return bounties[subscription].reward > 0;
  }
}
