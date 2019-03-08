pragma solidity 0.5.4;

import 'openzeppelin-solidity/contracts/ownership/Secondary.sol';
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import "./lib/Set.sol";

contract Subscription is Secondary, Pausable {
    using SafeMath for uint;
    using Set for Set.AddressSet;

    event Subscribed(address indexed subscriber);
    event Unsubscribed(address indexed subscriber);
    event PaymentProcessed(address indexed subscriber, uint nextPaymentAt);

    address public owner;
    address public token;
    uint public amount;
    uint public interval;

    Set.AddressSet internal subscribers;
    mapping(address => uint) subscribedAt;
    mapping(address => uint) nextPaymentAt;

    modifier checkTokenBalanceAfterTransfer(address addr, uint diff) {
      uint balanceBefore = ERC20(token).balnaceOf(addr);
      _;
      uint balanceAfter = ERC20(token).balanceOf(addr);

      require(balanceAfter.sub(balanceBefore) == diff, "Check token balance failed");
    }

    constructor(address _owner, address _token, uint _amount, uint _interval)
      public
    {
        require(_owner != address(0), "Owner address cannot be 0");
        require(_token != address(0), "Token address cannot be 0");
        require(_amount > 0, "Amount must be greater than 0");
        require(_interval > 0, "Payment interval must be greater than 0");

        owner = _owner;
        token = _token;
        amount =_amount;
        interval = _interval;
    }

    function isSubscribed(address addr) public view returns (bool) {
      return subscribers.has(addr);
    }

    function subscribe(address subscriber) public onlyPrimary whenNotPaused {
        require(!isSubscribed(subscriber), "Address is already subscribed");

        subscribers.add(subscriber);
        subscribedAt[subscriber] = block.timestamp;
        nextPaymentAt[subscriber] = block.timestamp.add(interval);

        emit Subscribed(subscriber);
    }

    function unsubscribe(address subscriber) public onlyPrimary whenNotPaused {
        require(isSubscribed(subscriber), "Not subscribed");

        subscribers.remove(subscriber);
        delete subscribedAt[subscriber];
        delete nextPaymentAt[subscriber];

        emit Unsubscribed(subscriber);
    }

    function canProcessPayment(address subscriber) public view returns (bool) {
        if (!isSubscribed(subscriber)) {
            return false;
        }

        uint allowance = ERC20(token).allowance(subscriber, this);
        uint balance = ERC20(token).balanceOf(subscriber);

        return (
            !paused() &&
            block.timestamp >= nextPaymentAt[subscriber] &&
            allowance >= amount &&
            balance >= amount
        );
    }

    function processPayment(address subscriber)
      public
      whenNotPaused
      checkTokenBalanceAfterTransfer(owner, amount)
    {
        require(canProcessPayment(subscriber), "Cannot process payment");

        uint start = subscribedAt[subscriber];
        uint duration = block.timestamp.sub(start);
        uint diff = duration.mod(interval);
        uint nextPayment = block.timestamp.sub(diff).add(interval);

        nextPaymentAt[subscriber] = nextPayment;

        require(
          ERC20(token).transferFrom(subscriber, owner, amount),
          "Failed to transfer tokens"
        );

        emit PaymentProcessed(subscriber, nextPayment);
    }

    function kill() external onlyPrimary {
        selfdestruct(owner);
    }

    function getSubscriberCount() public view returns (uint) {
      return subscribers.length();
    }

    function getSubscriber(uint index)
      public
      view
      returns (address subscriber, uint subscribedAt, uint nextPaymentAt)
    {
      subscriber = subscribers.get(index);

      return (subscriber, subscribedAt[subscriber], nextPaymentAt[subscriber]);
    }
}
