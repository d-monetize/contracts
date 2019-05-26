pragma solidity ^0.5.8;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract Subscription is Ownable, Pausable {
  event Subscribed(address indexed subscriber);
  event Unsubscribed(address indexed subscriber);
  event BountyUpdated(uint bounty);
  event Charged(address indexed subscriber, uint nextPayment);

  ERC20 public token;
  uint public amount;
  uint public interval;
  uint public bounty;

  mapping(address => uint) public nextPayment;

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

  function isSubscribed(address subscriber) public view returns (bool) {
    return nextPayment[subscriber] > 0;
  }

  function subscribe() public whenNotPaused {
    require(!isSubscribed(msg.sender), "Already subscribed");

    nextPayment[msg.sender] = block.timestamp;

    emit Subscribed(msg.sender);
  }

  function unsubscribe() public whenNotPaused {
    require(isSubscribed(msg.sender), "Not subscribed");

    nextPayment[msg.sender] = 0;

    emit Unsubscribed(msg.sender);
  }

  function canCharge(address subscriber) public view returns (bool) {
    return (
      !paused() &&
      isSubscribed(subscriber) &&
      block.timestamp >= nextPayment[subscriber] &&
      token.allowance(subscriber, address(this)) >= amount &&
      token.balanceOf(subscriber) >= amount &&
      token.allowance(owner(), address(this)) >= bounty
    );
  }

  function charge(address subscriber) public whenNotPaused {
    require(canCharge(subscriber), "Cannot charge");

    uint delta = (block.timestamp - nextPayment[subscriber]) % interval;
    nextPayment[subscriber] = block.timestamp + (interval - delta);

    require(
      token.transferFrom(subscriber, owner(), amount),
      "Failed to transfer to owner"
    );

    if (bounty > 0) {
      require(
        token.transferFrom(owner(), msg.sender, bounty),
        "Failed to transfer"
      );
    }

    emit Charged(subscriber, nextPayment[subscriber]);
  }

  function kill() external onlyOwner {
    selfdestruct(msg.sender);
  }
}
