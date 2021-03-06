pragma solidity 0.5.10;

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

  function contains(address _addr) public view returns (bool) {
    return set.contains(_addr);
  }
}
