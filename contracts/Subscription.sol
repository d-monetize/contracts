pragma solidity 0.5.10;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import "./lib/Set.sol";

contract Subscription is Ownable, Pausable {
  using Set for Set.Address;

  event Subscribed(address indexed subscriber);
  event Unsubscribed(address indexed subscriber);
  event BountyUpdated(uint bounty);
  event Charged(
    address indexed subscriber,
    uint paymentFor,
    uint paymentAt,
    uint nextPayment
  );

  ERC20 public token;
  uint public amount;
  uint public interval;
  uint public bounty;

  mapping(address => uint) public nextPayments;
  Set.Address internal subscribers;

  constructor(address _token, uint _amount, uint _interval, uint _bounty) public {
    require(_token != address(0), "Token address cannot be 0");
    require(_amount > 0, "Amount must be greater than 0");
    require(_bounty <= _amount, "Bounty must be less than or equal amount");
    require(
      _interval > 0 && _interval <= 100 days,
      "Interval must be greater than 0 and less than or equal to 100 days"
    );

    token = ERC20(_token);
    amount = _amount;
    interval = _interval;
    bounty = _bounty;
  }

  function updateBounty(uint _bounty) public onlyOwner whenNotPaused {
    bounty = _bounty;

    emit BountyUpdated(_bounty);
  }

  function isSubscribed(address _subscriber) public view returns (bool) {
    return subscribers.contains(_subscriber);
  }

  function subscribe() public whenNotPaused {
    require(!isSubscribed(msg.sender), "Already subscribed");

    subscribers.add(msg.sender);
    nextPayments[msg.sender] = block.timestamp;

    emit Subscribed(msg.sender);
  }

  function unsubscribe() public whenNotPaused {
    require(isSubscribed(msg.sender), "Not subscribed");

    subscribers.remove(msg.sender);
    nextPayments[msg.sender] = 0;

    emit Unsubscribed(msg.sender);
  }

  function canCharge(address _subscriber) public view returns (bool) {
    return (
      !paused() &&
      isSubscribed(_subscriber) &&
      block.timestamp >= nextPayments[_subscriber] &&
      token.allowance(_subscriber, address(this)) >= amount &&
      token.balanceOf(_subscriber) >= amount &&
      token.allowance(owner(), address(this)) >= bounty
    );
  }

  function charge(address _subscriber) public whenNotPaused {
    require(canCharge(_subscriber), "Cannot charge");

    uint paymentFor = nextPayments[_subscriber];

    uint delta = (block.timestamp - nextPayments[_subscriber]) % interval;
    nextPayments[_subscriber] = block.timestamp + (interval - delta);

    require(
      token.transferFrom(_subscriber, owner(), amount),
      "Failed to transfer to owner"
    );

    if (bounty > 0) {
      require(
        token.transferFrom(owner(), msg.sender, bounty),
        "Failed to transfer"
      );
    }

    emit Charged(_subscriber, paymentFor, block.timestamp, nextPayments[_subscriber]);
  }

  function getSubscriberCount() public view returns (uint) {
    return subscribers.count();
  }

  function getSubscriber(uint _index) public view returns (address) {
    return subscribers.get(_index);
  }

  function kill() external onlyOwner {
    selfdestruct(msg.sender);
  }
}
