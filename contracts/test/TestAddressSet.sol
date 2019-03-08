pragma solidity 0.5.4;

import "../lib/Set.sol";

contract TestAddressSet {
  using Set for Set.AddressSet;

  Set.AddressSet internal addresses;

  function add(address addr) public {
    addresses.add(addr);
  }

  function remove(address addr) public {
    addresses.remove(addr);
  }

  function length() public view returns (uint) {
    return addresses.length();
  }

  function get(uint index) public view returns (address) {
    return addresses.get(index);
  }

  function has(address addr) public view returns (bool) {
    return addresses.has(addr);
  }
}
