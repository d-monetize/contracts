pragma solidity ^0.5.3;

library Set {
  struct AddressSet {
    mapping(address => uint) indexOf;
    address[] addresses;
  }

  function add(AddressSet storage self, address addr) internal {
    if (has(self, addr)) {
      return;
    }

    self.addresses.push(addr);
    self.indexOf[addr] = self.addresses.length - 1;
  }

  function remove(AddressSet storage self, address addr) internal {
    require(has(self, addr), "Address does not exist");

    uint index = self.indexOf[addr];

    address last = self.addresses[self.addresses.length - 1];
    self.addresses[index] = last;
    self.indexOf[last] = index;

    self.addresses.pop();
    delete self.indexOf[addr];
  }

  function has(AddressSet storage self, address addr) internal view returns (bool) {
    if (self.addresses.length == 0) {
      return false;
    }

    uint index = self.indexOf[addr];

    return self.addresses[index] == addr;
  }

  function get(AddressSet storage self, uint index) internal view returns (address) {
    return self.addresses[index];
  }

  function length(AddressSet storage self) internal view returns (uint) {
    return self.addresses.length;
  }
}
