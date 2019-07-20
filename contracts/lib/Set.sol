pragma solidity 0.5.8;

library Set {
  struct Address {
    mapping(address => bool) inserted;
    mapping(address => uint) indexOf;
    address[] elements;
  }

  function add(Address storage self, address _addr) internal {
    require(!self.inserted[_addr], "Address is already inserted");

    self.inserted[_addr] = true;
    self.indexOf[_addr] = self.elements.length;
    self.elements.push(_addr);
  }

  function remove(Address storage self, address _addr) internal {
    require(self.inserted[_addr], "Address is not yet inserted");

    // Move the last element into the place to delete
    uint index = self.indexOf[_addr];
    address addrToMove = self.elements[self.elements.length - 1];

    self.elements[index] = addrToMove;
    self.indexOf[addrToMove] = index;

    self.elements.pop();
    delete self.indexOf[_addr];
    delete self.inserted[_addr];
  }

  function get(Address storage self, uint _index) internal view returns (address) {
    return self.elements[_index];
  }

  function count(Address storage self) internal view returns (uint) {
    return self.elements.length;
  }
}
