pragma solidity 0.5.8;

import "../lib/Set.sol";

contract TestAddressSet {
  using Set for Set.Address;

  Set.Address internal set;

  function add(address _addr) public {
    set.add(_addr);
  }

  function remove(address _addr) public {
    set.remove(_addr);
  }

  function get(uint _index) public view returns (address) {
    return set.get(_index);
  }

  function count() public view returns (uint) {
    return set.count();
  }
}
