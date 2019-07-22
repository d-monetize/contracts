pragma solidity 0.5.8;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import "./lib/Set.sol";

contract SubscriptionRegistry is Ownable {
  using Set for Set.Address;

  event SubscriptionCreated(address indexed subscription, address indexed owner);
  event SubscriptionDeleted(address indexed subscription, address indexed owner);
  event SubscriberAdded(address indexed subscription, address indexed subscriber);
  event SubscriberRemoved(address indexed subscription, address indexed subscriber);

  // subscriptions created by an address
  mapping(address => Set.Address) internal createdBy;

  // subscriptions subscribed by an address
  mapping(address => Set.Address) internal subscribedBy;

  // mapping from subscription to owner
  mapping(address => address) public ownerOf;

  mapping(address => bool) public authorized;

  modifier onlyAuthorized() {
    require(authorized[msg.sender], "Subscription is not authorized");
    _;
  }

  function addSubscription(address _subscription, address _owner)
    public onlyOwner
  {
    createdBy[_owner].add(_subscription);

    ownerOf[_subscription] = _owner;
    authorized[_subscription] = true;

    emit SubscriptionCreated(_subscription, _owner);
  }

  function removeSubscription() onlyAuthorized public {
    address owner = ownerOf[msg.sender];
    
    delete ownerOf[msg.sender];
    delete authorized[msg.sender];

    createdBy[owner].remove(msg.sender);

    emit SubscriptionDeleted(msg.sender, owner);
  }

  function addSubscriber(address _subscriber) onlyAuthorized public {
    subscribedBy[_subscriber].add(msg.sender);

    emit SubscriberAdded(msg.sender, _subscriber);
  }

  function removeSubscriber(address _subscriber) onlyAuthorized public {
    subscribedBy[_subscriber].remove(msg.sender);

    emit SubscriberRemoved(msg.sender, _subscriber);
  }

  function getCreatedByCount(address _owner)
    public view returns (uint)
  {
    return createdBy[_owner].count();
  }

  function getCreatedBy(address _owner, uint _index)
    public view returns (address)
  {
    return createdBy[_owner].get(_index);
  }

  function getSubscribedByCount(address _subscriber) public view returns (uint) {
    return subscribedBy[_subscriber].count();
  }

  function getSubscribedBy(address _subscriber, uint _index)
    public view returns (address)
  {
    return subscribedBy[_subscriber].get(_index);
  }
}
