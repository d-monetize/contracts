pragma solidity 0.5.2;

import 'openzeppelin-solidity/contracts/ownership/Secondary.sol';
import "openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';

contract Subscription is Secondary, Pausable {
    event Subscribed(address indexed subscriber, uint nextPaymentAt);
    event Unsubscribed(address indexed subscriber);
    event PaymentProcessed(address indexed subscriber, uint nextPaymentAt);

    address payable public owner;
    address public token;
    uint public amount;
    uint public interval;

    struct Subscriber {
      uint subscribedAt;
      uint nextPaymentAt;
    }

    mapping(address => Subscriber) public subscribers;

    modifier checkTokenBalanceAfterTransfer(address addr, uint diff) {
      uint balanceBefore = ERC20(token).balanceOf(addr);
      _;
      uint balanceAfter = ERC20(token).balanceOf(addr);

      require(balanceAfter > balanceBefore, "Token transfer failed");
      require(balanceAfter - balanceBefore == diff, "Check token balance failed");
    }

    constructor(address payable _owner, address _token, uint _amount, uint _interval)
      public
    {
        require(_owner != address(0), "Owner address cannot be 0");
        require(_token != address(0), "Token address cannot be 0");
        require(_amount > 0, "Amount must be greater than 0");
        require(
          _interval > 0 && _interval < 100 weeks,
          "Payment interval must be greater than 0"
        );

        owner = _owner;
        token = _token;
        amount =_amount;
        interval = _interval;
    }

    function isSubscribed(address addr) public view returns (bool) {
      return subscribers[addr].subscribedAt > 0;
    }

    function subscribe(address subscriber) public onlyPrimary whenNotPaused {
        require(!isSubscribed(subscriber), "Address is already subscribed");

        subscribers[subscriber] = Subscriber({
          subscribedAt: block.timestamp,
          nextPaymentAt: block.timestamp + interval
        });

        emit Subscribed(subscriber, subscribers[subscriber].nextPaymentAt);
    }

    function unsubscribe(address subscriber) public onlyPrimary whenNotPaused {
        require(isSubscribed(subscriber), "Not subscribed");

        delete subscribers[subscriber];

        emit Unsubscribed(subscriber);
    }

    function canProcessPayment(address subscriber) public view returns (bool) {
        if (!isSubscribed(subscriber)) {
            return false;
        }

        uint allowance = ERC20(token).allowance(subscriber, address(this));
        uint balance = ERC20(token).balanceOf(subscriber);

        return (
            !paused() &&
            block.timestamp >= subscribers[subscriber].nextPaymentAt &&
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

        uint start = subscribers[subscriber].subscribedAt;
        uint duration = block.timestamp - start;
        uint nextPaymentAt = block.timestamp - (duration % interval) + interval;

        subscribers[subscriber].nextPaymentAt =  nextPaymentAt;

        require(
          ERC20(token).transferFrom(subscriber, owner, amount),
          "Failed to transfer tokens"
        );

        emit PaymentProcessed(subscriber, nextPaymentAt);
    }

    function kill() external onlyPrimary {
        selfdestruct(owner);
    }
  }
