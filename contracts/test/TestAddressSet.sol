pragma solidity 0.5.8;

import "../AddressSetLib.sol";

contract TestAddressSet {
  using AddressSetLib for AddressSetLib.AddressSet;

  AddressSetLib.AddressSet internal set;

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
