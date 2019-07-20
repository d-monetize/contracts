pragma solidity 0.5.8;

library AddressSetLib {
  struct AddressSet {
    mapping(address => bool) inserted;
    mapping(address => uint) indexOf;
    address[] addresses;
  }

  function add(AddressSet storage self, address _addr) internal {
    require(!self.inserted[_addr], "Address is already inserted");

    self.inserted[_addr] = true;
    self.indexOf[_addr] = self.addresses.length;
    self.addresses.push(_addr);
  }

  function remove(AddressSet storage self, address _addr) internal {
    require(self.inserted[_addr], "Address is not yet inserted");

    // Move the last element into the place to delete
    uint index = self.indexOf[_addr];
    address addrToMove = self.addresses[self.addresses.length - 1];

    self.addresses[index] = addrToMove;
    self.indexOf[addrToMove] = index;

    self.addresses.pop();
    delete self.indexOf[_addr];
    delete self.inserted[_addr];
  }

  function get(AddressSet storage self, uint _index) internal view returns (address) {
    return self.addresses[_index];
  }

  function count(AddressSet storage self) internal view returns (uint) {
    return self.addresses.length;
  }
}
